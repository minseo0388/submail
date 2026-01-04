import dotenv from 'dotenv';
import path from 'path';

// Load from root .env (Client requirement: "Manage in one file")
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
    discord: {
        token: process.env.DISCORD_BOT_TOKEN || '',
        guildId: process.env.DISCORD_GUILD_ID || '',
        clientId: process.env.DISCORD_CLIENT_ID || '',
    },
    smtp: {
        port: parseInt(process.env.SMTP_PORT || '25', 10),
        domain: process.env.SMTP_DOMAIN || 'example.com',
        dkim: {
            privateKeyPath: process.env.DKIM_PRIVATE_KEY_PATH || '',
            selector: process.env.DKIM_KEY_SELECTOR || 'default',
        }
    },
    web: {
        url: process.env.WEB_URL || 'http://localhost:3000',
    }
};
