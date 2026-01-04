# <div align="center">Submail System</div>

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Prisma](https://img.shields.io/badge/Prisma-5.0-green)
![License](https://img.shields.io/badge/License-GPLv3-red)

**A Secure, Self-Hosted Email Alias System for Discord Communities.**

[Features](#features) • [Prerequisites](#prerequisites) • [Quick Start](#quick-start) • [Environment](#environment-setup)

</div>

---

## Features

- 🔐 **Discord Gate**: Restrict access to your guild members.
- 🛡️ **Advanced Security**: CSP, HSTS, Rate Limiting, and PII Masking by default.
- 📧 **SMTP Engine**: Built-in Node.js SMTP server with spam filtering.
- 📝 **Alias Management**: Create, Pause, and Delete aliases instantly.
- 📊 **Audit Logs**: Track every forwarded email and blocked attempt.

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js**: v20 or higher (v22 Recommended)
- **Docker**: For easy deployment (Optional)
- **Discord Application**: Create one at [Discord Developers](https://discord.com/developers/applications).

---

## Quick Start

Get up and running locally in 3 steps.

### 1. Clone & Install
```bash
git clone https://github.com/minseo0388/submail.git
cd submail
npm install
```

### 2. Configure Environment
Copy the example file and fill in your Discord keys.
```bash
cp .env.example .env
```
*(See [Environment Setup](#environment-setup) for details)*

### 3. Run
Start the development server (Web + Bot).
```bash
npx prisma db push
npm run dev
```
> Open [http://localhost:3000](http://localhost:3000) to verify.

---

## Environment Setup

The `.env` file is the heart of your security configuration.

### 🔑 Identity & Database
| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | SQLite or PostgreSQL URL | `file:./dev.db` |
| `AUTH_SECRET` | Secret for session encryption | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL of your dashboard | `http://localhost:3000` |

### 🤖 Discord Configuration
| Variable | Description |
| :--- | :--- |
| `DISCORD_CLIENT_ID` | OAuth2 Client ID |
| `DISCORD_CLIENT_SECRET` | OAuth2 Client Secret |
| `DISCORD_GUILD_ID` | (Optional) Restrict login to this Server ID |

### ⚡ Rate Limiting (Upstash)
| Variable | Description |
| :--- | :--- |
| `UPSTASH_REDIS_REST_URL` | Redis URL for Rate Limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Redis Access Token |

### 📨 Mail Server
| Variable | Description | Default |
| :--- | :--- | :--- |
| `SMTP_PORT` | Port for incoming mail | `25` |
| `SMTP_DOMAIN` | Domain for aliases | `example.com` |

---

## 🚀 Deployment Guide

### Vercel (Web Dashboard)
1.  **Push** your code to GitHub.
2.  **Import** the project in Vercel.
3.  **Environment Variables**: Add all variables from `.env` to Vercel Settings.
4.  **Build Command**: `npx prisma generate && next build`
    *   *Note: The SMTP server (`apps/bot`) cannot run on Vercel. You need a separate VPS or generic host (Render/Railway/EC2) for the Bot.*

### Database Migration
When deploying to production:
```bash
# Apply migrations to prod DB
npx prisma migrate deploy
```

---


---

## 📡 Deliverability & DNS

To ensure your emails land in the Inbox (not Spam), you **must** configure these DNS records.

### 1. Reverse DNS (PTR)
*Action*: Go to your VPS Provider (AWS, DigitalOcean, etc.) settings.
*   **Value**: `mail.yourdomain.com` (Must match your SMTP hostname)

### 2. SPF (Sender Policy Framework)
*Record Type*: `TXT`
*   **Host**: `@`
*   **Value**: `v=spf1 mx a:mail.yourdomain.com -all`

### 3. DKIM (DomainKeys Identified Mail)
*Record Type*: `TXT`
*   **Host**: `default._domainkey` (or your selector)
*   **Value**: `v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY_HERE`
    > *Note*: Generate this keypair using `openssl` or an online tool. Put the private key on your server and path in `.env`.

### 4. DMARC
*Record Type*: `TXT`
*   **Host**: `_dmarc`
*   **Value**: `v=DMARC1; p=quarantine; rua=mailto:admin@yourdomain.com`

---

## Troubleshooting

<details>
<summary><strong>SMTP Port Permission Denied?</strong></summary>
Port 25 requires root privileges. On Linux, grant permission to Node:

```bash
sudo setcap 'cap_net_bind_service=+ep' $(which node)
```
</details>

<details>
<summary><strong>Redis Connection Error?</strong></summary>
If you see "Redis Error (Fail-open)", check your Upstash credentials. The system will continue to work but without rate limiting.
</details>

---

<div align="center">
Made with ❤️ by Choi Minseo
</div>
