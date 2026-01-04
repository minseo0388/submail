import 'server-only';
import NextAuth, { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { PrismaClient } from "@submail/db";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID || "",
            clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
            authorization: { params: { scope: "identify email guilds" } },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error', // Optional: Add a custom error page later if needed
    },
    cookies: {
        sessionToken: {
            name: `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
    callbacks: {
        async signIn({ user, account }) {
            // 1. Full Token Exchange Flow
            if (account?.provider === "discord" && account.access_token) {
                try {
                    // 1.1 Verify Token with Discord API
                    const res = await fetch("https://discord.com/api/users/@me", {
                        headers: {
                            Authorization: `Bearer ${account.access_token}`,
                        },
                    });

                    if (!res.ok) {
                        console.error(`Token Verification Failed: ${res.status}`);
                        return false;
                    }

                    const discordUser = await res.json();

                    if (discordUser.id !== account.providerAccountId) {
                        console.error("Token/ID mismatch! Potential Spoofing.");
                        return false;
                    }

                    // 1.2 Guild Membership Check (if required)
                    const targetGuildId = process.env.DISCORD_GUILD_ID;
                    if (targetGuildId) {
                        const guildRes = await fetch("https://discord.com/api/users/@me/guilds", {
                            headers: {
                                Authorization: `Bearer ${account.access_token}`,
                            },
                        });

                        if (guildRes.ok) {
                            const guilds = await guildRes.json();
                            const isMember = guilds.some((g: any) => g.id === targetGuildId);
                            if (!isMember) {
                                console.log(`User ${user.name} denied. Not in guild ${targetGuildId}`);
                                return false;
                            }
                        } else {
                            console.error("Failed to fetch guilds for validation");
                            return false;
                        }
                    }

                    // 1.3 Update/Link User in Database
                    // We map the Discord ID to providerId, and generate/use a UUID for internal ID
                    const dbUser = await prisma.user.upsert({
                        where: { providerId: discordUser.id },
                        create: {
                            providerId: discordUser.id,
                            realEmail: user.email,
                            // id will be auto-generated UUID
                        },
                        update: {
                            realEmail: user.email,
                        }
                    });

                    // Attach the internal UUID to the user object so it flows to JWT
                    user.id = dbUser.id;

                    return true;
                } catch (error) {
                    console.error("SignIn Callback Error:", error);
                    return false;
                }
            }
            return false;
        },
        async jwt({ token, user }) {
            // Initial sign in
            if (user) {
                token.id = user.id; // This is now the internal UUID
                token.providerId = (user as any).providerId; // Store Discord ID if needed, but safer not to expose
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user && token?.sub) {
                // @ts-ignore
                session.user.id = token.id as string; // Provide UUID to client
            }
            return session;
        },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
