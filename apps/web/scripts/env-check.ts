import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const required = [
    'DATABASE_URL',
    'AUTH_SECRET',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'DISCORD_BOT_TOKEN',
    'SMTP_DOMAIN',
];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
    console.error('\n❌ Missing Required Environment Variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nPlease check your .env file.\n');
    process.exit(1);
} else {
    console.log('\n✅ All required environment variables are present.\n');
}
