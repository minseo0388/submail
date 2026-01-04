type AuditEvent = {
    action: string;
    userId: string;
    ip: string;
    details?: string;
};

export async function logAudit(event: AuditEvent) {
    // Mask PII if present in details (simple heuristic)
    let safeDetails = event.details || "";
    // Mask email addresses patterns: x***@domain.com
    safeDetails = safeDetails.replace(/([a-zA-Z0-9._-]+)(@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi, (match, user, domain) => {
        return user.substring(0, 1) + "***" + domain;
    });

    const logEntry = {
        timestamp: new Date().toISOString(),
        ...event,
        details: safeDetails,
    };

    // In production, send to external logging service
    if (process.env.NODE_ENV === 'production') {
        try {
            // Example: await fetch(process.env.AUDIT_LOG_URL, { method: 'POST', body: JSON.stringify(logEntry) });
            console.log(`[AUDIT_EXTERNAL_PUSH] ${JSON.stringify(logEntry)}`);
        } catch (e) {
            console.error("[AUDIT] Failed to push to external service", e);
        }
    } else {
        console.log(`[AUDIT]`, logEntry);
    }
}
