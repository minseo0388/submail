# <div align="center">Submail System</div>

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Prisma](https://img.shields.io/badge/Prisma-5.0-green)
![Redis](https://img.shields.io/badge/Redis-Upstash-red)
![License](https://img.shields.io/badge/License-GPLv3-red)

**A Secure, Self-Hosted Email Alias System for Discord Communities.**

[Features](#features) • [Security](#security-architecture) • [Quick Start](#quick-start) • [Environment](#environment-setup) • [Deployment](#deployment)

</div>

---

## Features

- 🔐 **Discord Gate**: Restrict access to your guild members with server-side token validation.
- 🛡️ **Advanced Security**: CSP, HSTS, Rate Limiting, and PII Masking by default.
- 📧 **SMTP Engine**: Built-in Node.js SMTP server with spam filtering and exponential backoff retries.
- 📝 **Alias Management**: Create, Pause, and Delete aliases instantly.
- 📊 **Audit Logs**: Track every forwarded email and blocked attempt.
- 🩺 **Health Monitoring**: Real-time status checks for DB, Redis, and SMTP services (`/api/health`).

---

## Security Architecture

We have implemented a defense-in-depth security strategy:

- **Identity & Auth**:
  - Full Token Exchange: Server-side validation of Discord tokens.
  - Stateless Cookies: Secure, HttpOnly, SameSite=Lax cookies.
  - UUIDs: Internal user IDs are UUIDs; Discord IDs are never exposed.

- **API Security**:
  - Zod Validation & Rate Limiting (Upstash).
  - Error Masking: Production errors are masked as generic 500s.
  - Auditing: Critical actions are logged with PII masking.

- **Mail Security**:
  - Header Sanitization & Content Filtering.
  - Resilience: `p-retry` ensures reliable delivery even during network blips.

---

## Quick Start

### 1. Prerequisites
- **Node.js**: v18.17+
- **Discord Application**: Client ID/Secret & Bot Token.

### 2. Installation
```bash
git clone https://github.com/minseo0388/submail.git
cd submail
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env and fill in your keys
```

### 4. Run
```bash
# Push DB Schema
npx prisma db push

# Start Dev Server (Web + Bot)
npm run dev
```

---

## Environment Setup

See `.env.example` for a complete template.
- **Identity**: `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`.
- **Discord**: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN`.
- **Redis**: `UPSTASH_REDIS_REST_URL` (Optional but recommended for Rate Limiting).
- **Mail**: `SMTP_PORT`, `SMTP_DOMAIN`.

---

## Deployment

### Vercel (Web Dashboard)
1. Push to GitHub.
2. Import in Vercel.
3. Add Environment Variables.
4. Build Command: `npx prisma generate && next build`.

### VPS/Docker (Full Stack)
Use the included `docker-compose.yml` (if available) or run with PM2 on a VPS for the SMTP server capability.

---

<div align="center">
Made with ❤️ by Choi Minseo
</div>
