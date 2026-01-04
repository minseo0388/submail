# Environment Variables

This document lists all environment variables used in Submail. Configure these in your `.env` file.

## 🔑 Core & Database

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | ✅ | Connection string for Prisma. Supports SQLite (`file:`) and PostgreSQL (`postgresql://`). | `file:./dev.db` |
| `AUTH_SECRET` | ✅ | A random string used to encrypt NextAuth.js session tokens. | `super-secret-random-string` |
| `WEB_URL` | ✅ | The full public URL of your web dashboard. | `https://submail.example.com` |
| `NEXTAUTH_URL` | ✅ | Canonical URL for NextAuth. Usually same as `WEB_URL`. | `https://submail.example.com` |

## 🤖 Discord Authentication

| Variable | Required | Description |
| :--- | :---: | :--- |
| `DISCORD_CLIENT_ID` | ✅ | Application ID from Discord Developer Portal. |
| `DISCORD_CLIENT_SECRET` | ✅ | Client Secret from Discord Developer Portal. |
| `DISCORD_BOT_TOKEN` | ✅ | Bot Token. Required for fetching user details and DMing. |
| `DISCORD_GUILD_ID` | ❌ | If set, only members of this Guild ID can log in. |

## 📨 Mail Server Configuration

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `SMTP_DOMAIN` | ✅ | - | The domain managed by this server (e.g., `example.com`). |
| `SMTP_PORT` | ❌ | `25` | Port to listen for incoming emails. |

## ⚡ Rate Limiting (Upstash)

Required if you want to enable rate limiting.

| Variable | Description |
| :--- | :--- |
| `UPSTASH_REDIS_REST_URL` | HTTPS URL for your Upstash Redis instance. |
| `UPSTASH_REDIS_REST_TOKEN` | REST Token for Upstash Redis. |

## 🔒 Security

| Variable | Default | Description |
| :--- | :--- | :--- |
| `ENABLE_PII_MASKING` | `false` | Set to `true` to mask email contents in logs. |
