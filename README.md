# Submail System

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Prisma](https://img.shields.io/badge/Prisma-5.0-green)
![Redis](https://img.shields.io/badge/Redis-Upstash-red)
![License](https://img.shields.io/badge/License-Apache_2.0-blue)

**A Secure, Self-Hosted Email Alias System for Discord Communities.**

[📚 Documentation](./docs/index.md) • [Architecture](./docs/architecture.md) • [Features](#features) • [Deployment](./docs/deployment.md)

---

## 📖 Introduction

**Submail** is a privacy-focused email forwarding system designed for Discord communities. It allows designated users to create unlimited email aliases (like `netflix@yourdomain.com`) that forward to their real email address.

**[👉 Read the full documentation for detailed guides.](./docs/index.md)**

---

## 🚀 Key Features

-   **Discord Gate**: Strict access control via Discord Server membership.
-   **Hybrid Architecture**: Next.js 14 Dashboard + Node.js Custom SMTP Server.
-   **Security**: SRS-Lite forwarding, CSP, Rate Limiting, and PII Masking.
-   **Deliverability**: Full support for SPF, DKIM, and DMARC.

---

## 🛠️ Quick Links

-   [**Development Setup**](./docs/setup.md): Run Submail locally.
-   [**Deployment Guide**](./docs/deployment.md): Docker, Oracle Cloud, and Vercel.
-   [**Architecture Deep Dive**](./docs/architecture.md): How the internals work.
-   [**Environment Variables**](./docs/env-vars.md): Full `.env` reference.

---

## 🩺 System Health

You can monitor the status of the system via the Health API:
`GET /api/health`

```json
{
  "db": "healthy",
  "redis": "healthy",
  "smtp": "healthy",
  "status": "ok"
}
```

---

Made with ❤️ by Choi Minseo
