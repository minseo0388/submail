import { SMTPServer, SMTPServerSession, SMTPServerAddress, SMTPServerDataStream } from 'smtp-server';
import { simpleParser, ParsedMail } from 'mailparser';
import { config } from './config';
import { PrismaClient } from '@submail/db';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// Create a transporter for outbound mail
// For development, we might not have a relay. 
// If specific SMTP relay is provided in ENV, use it. Otherwise, assume direct or local sendmail.
const transporter = nodemailer.createTransport({
    // If you have a specific relay (e.g. Gmail, SendGrid), configure it here via env vars.
    // For now, we rely on Direct Send (MX lookup) or local sendmail if configured on host.
    // But standard nodemailer 'direct' requires specific setup.
    // We'll default to a simple configuration that logs or attempts direct connect.
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail',
    dkim: (config.smtp.dkim && config.smtp.dkim.privateKeyPath) ? {
        domainName: config.smtp.domain,
        keySelector: config.smtp.dkim.selector,
        privateKey: config.smtp.dkim.privateKeyPath // Path to key file
    } : undefined
});

export function startSMTPServer() {
    const server = new SMTPServer({
        secure: false,
        disabledCommands: ['AUTH'],
        size: 10 * 1024 * 1024, // Limit email size to 10MB
        maxClients: 50, // Limit concurrent connections

        onConnect(session: SMTPServerSession, callback: (err?: Error) => void) {
            console.log(`[SMTP] Connection from ${session.remoteAddress}`);
            callback();
        },

        async onRcptTo(address: SMTPServerAddress, session: SMTPServerSession, callback: (err?: Error | null) => void) {
            const email = address.address.toLowerCase();
            if (!email.endsWith(`@${config.smtp.domain}`)) {
                return callback(new Error('Relay access denied'));
            }

            try {
                const localPart = email.split('@')[0];
                const alias = await prisma.alias.findFirst({
                    where: { address: localPart },
                    include: { rules: true }
                });

                if (!alias) {
                    console.log(`[SMTP] Unknown User: ${localPart}`);
                    return callback(new Error('User unknown'));
                }

                // Attach alias to session for onData use
                (session as any).alias = alias;

                callback();
            } catch (err) {
                console.error("DB Error on RCPT TO:", err);
                callback(new Error('Internal Error'));
            }
        },

        onData(stream: SMTPServerDataStream, session: SMTPServerSession, callback: (err?: Error | null) => void) {
            simpleParser(stream, async (err: Error | null, parsed: ParsedMail) => {
                if (err) {
                    console.error('[SMTP] Parse Error:', err);
                    return callback(new Error('Message parse failure'));
                }

                const alias = (session as any).alias;
                if (!alias) {
                    // Should be caught in RCPT TO, but just in case
                    return callback();
                }

                console.log(`[SMTP] Processing mail for alias: ${alias.address}`);

                // Process Rules
                // Default: If no BLOCK rule, Forward.
                // Process Rules
                const blockRule = alias.rules.find((r: any) => r.type === "BLOCK");
                if (blockRule) {
                    console.log(`[SMTP] Blocked email for ${alias.address}`);
                    await (prisma as any).log.create({
                        data: {
                            aliasId: alias.id,
                            sender: parsed.from?.text || "Unknown",
                            subject: parsed.subject || "No Subject",
                            status: "BLOCKED",
                            message: "Alias is paused/blocked",
                            destination: "Blocked"
                        }
                    });
                    return callback();
                }

                try {
                    const user = await prisma.user.findUnique({ where: { id: alias.userId } });

                    // PREFER RULE DESTINATION
                    let targetEmail = user?.realEmail;
                    const forwardRule = alias.rules.find((r: any) => r.type === "FORWARD");
                    if (forwardRule && forwardRule.destination) {
                        targetEmail = forwardRule.destination;
                    }

                    if (!targetEmail) {
                        console.error("[SMTP] No destination email found");
                        return callback();
                    }

                    console.log(`[SMTP] Forwarding to ${targetEmail}`);

                    const message = {
                        from: `forwardCheck@${config.smtp.domain}`,
                        to: targetEmail,
                        subject: `[FWD] ${parsed.subject}`,
                        text: `Forwarded from ${alias.address}@${config.smtp.domain}\n\nOriginal Sender: ${parsed.from?.text}\n\n${parsed.text}`,
                        html: parsed.html ? `
                            <p><strong>Forwarded from ${alias.address}@${config.smtp.domain}</strong></p>
                            <p><strong>Original Sender:</strong> ${parsed.from?.text}</p>
                            <hr/>
                            ${parsed.html}
                        ` : undefined,
                        attachments: parsed.attachments.map(att => ({
                            filename: att.filename,
                            content: att.content,
                            contentType: att.contentType,
                            cid: att.cid // Content-ID for inline images
                        }))
                    };

                    try {
                        await transporter.sendMail(message);
                        console.log("[SMTP] Forwarded successfully");
                        await (prisma as any).log.create({
                            data: {
                                aliasId: alias.id,
                                sender: parsed.from?.text || "Unknown",
                                subject: parsed.subject || "No Subject",
                                status: "SUCCESS",
                                destination: targetEmail
                            }
                        });
                    } catch (sendErr: any) {
                        console.error("[SMTP] Forwarding Failed:", sendErr);
                        await (prisma as any).log.create({
                            data: {
                                aliasId: alias.id,
                                sender: parsed.from?.text || "Unknown",
                                subject: parsed.subject || "No Subject",
                                status: "FAILED",
                                message: sendErr.message || "SMTP Error",
                                destination: targetEmail
                            }
                        });
                    }

                } catch (dbErr) {
                    console.error("[SMTP] forward logic error", dbErr);
                }

                callback();
            });
        }
    });

    server.listen(config.smtp.port, () => {
        console.log(`[SMTP] Server listening on port ${config.smtp.port}`);
    });
}
