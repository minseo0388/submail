import NextAuth, { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
// import { PrismaAdapter } from "@next-auth/prisma-adapter";
// import { PrismaClient } from "@submail/db";

// const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
    // adapter: PrismaAdapter(prisma),
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID || "",
            clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
            authorization: { params: { scope: "identify email guilds" } },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            // GUILD CHECK LOGIC
            // If DISCORD_GUILD_ID is set, we must check if user is in that guild.
            const targetGuildId = process.env.DISCORD_GUILD_ID;
            if (!targetGuildId) return true; // No restriction

            if (account?.provider === "discord" && account.access_token) {
                try {
                    const res = await fetch("https://discord.com/api/users/@me/guilds", {
                        headers: {
                            Authorization: `Bearer ${account.access_token}`,
                        },
                    });

                    if (res.ok) {
                        const guilds = await res.json();
                        const isMember = guilds.some((g: any) => g.id === targetGuildId);
                        if (!isMember) {
                            console.log(`User ${user.name} denied. Not in guild ${targetGuildId}`);
                            return false; // Access Denied
                        }
                        return true; // Access Granted
                    } else {
                        console.error(`Discord API Error: ${res.status}`);
                        return false; // Fail closed
                    }
                } catch (error) {
                    console.error("Failed to fetch guilds:", error);
                    return false; // Fail closed
                }
            }
            return false; // Fail closed for any other logic gap
        },
        async session({ session, user, token }) {
            if (session?.user) {
                // session.user.id = user.id; // if using adapter
                // if using jwt
                if (token?.sub) {
                    // @ts-ignore
                    session.user.id = token.sub;
                }
            }
            return session;
        },
        async jwt({ token, user, account, profile }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        }
    },
    session: {
        strategy: "jwt", // Use JWT for now since adapter is pending
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
