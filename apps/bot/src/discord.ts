import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './config';

export const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

export async function startDiscordBot() {
    client.on('ready', () => {
        console.log(`[Discord] Logged in as ${client.user?.tag}`);
    });

    await client.login(config.discord.token);
}
