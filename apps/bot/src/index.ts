import { config } from './config';
import { startSMTPServer } from './smtp';
import { startDiscordBot } from './discord';

async function main() {
    console.log('Starting Submail Bot & SMTP Service...');

    // Start Discord Bot
    await startDiscordBot();

    // Start SMTP Server
    startSMTPServer();

    console.log('Service is up and running.');
}

main().catch(console.error);
