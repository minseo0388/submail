# Deployment Guide

Submail can be deployed in various ways depending on your infrastructure preference.

## Option 1: Docker Compose (Recommended for Self-Hosting)

This is the easiest way to get everything running on a VPS.

### Prerequisites
-   A server (VPS) with Docker and Docker Compose installed.
-   A domain name configured with DNS records (see *DNS Configuration* below).

### Steps

1.  **Clone the repo** on your server.
2.  **Create `.env`** file and populate it with production values.
3.  **Run Docker Compose**:
    ```bash
    docker-compose up -d
    ```

This will start the `web` container on port 3000 and the `bot` container on port 25. You should put a reverse proxy (like Nginx or Traefik) in front of the web container to handle HTTPS (port 443).

## Option 2: Oracle Cloud (Free Tier)

Oracle Cloud offers a generous free tier that is suitable for hosting Submail.

### Hardware Setup
-   **Instance**: VM.Standard.A1.Flex (ARM) with 4 OCPUs and 24GB RAM (Free Tier).
-   **OS**: Ubuntu or Oracle Linux.

### Network Configuration (**Critical**)
Oracle Cloud blocks port 25 by default. You generally cannot open it for *outbound* traffic easily, but for *inbound* (receiving mail), you need to open it in two places:
1.  **Oracle VCN Security List**: Add an Ingress Rule for TCP Port 25 (0.0.0.0/0).
2.  **Instance Firewall (iptables/ufw)**: Allow port 25.

### Deployment Steps
Follow the *Docker Compose* steps above. Since this is an ARM instance, Docker will automatically pull/build the correct architecture images if the base images support it (Node.js official images do).

## Option 3: Vercel + Separate VPS (for Bot)

If you prefer Vercel for the web frontend:

1.  **Web**: Deploy the `apps/web` directory to Vercel.
    -   Set environment variables in Vercel project settings.
    -   Configure `DATABASE_URL` to point to a managed database (e.g., Supabase, Neon, or a Postgres on your VPS). *SQLite will NOT work on Vercel.*
2.  **Bot**: You still need a VPS to receive emails on port 25.
    -   Deploy only the bot part or run the full docker-compose but ignore the web container.
    -   Ensure it connects to the *same* database as Vercel.

## 📡 DNS Configuration

For the system to receive emails and for them to pass spam filters, you must configure DNS.

| Type | Host | Value | Purpose |
| :--- | :--- | :--- | :--- |
| `A` | `mail` | `<Your VPS IP>` | Points subdomain to server |
| `MX` | `@` | `10 mail.yourdomain.com` | Directs email to your server |
| `TXT` | `@` | `v=spf1 mx -all` | SPF Record (approves your server) |
| `TXT` | `_dmarc` | `v=DMARC1; p=quarantine;` | DMARC Policy |

> **Reverse DNS (PTR)**: Essential for deliverability. Configure this in your VPS provider's networking dashboard to map your IP back to `mail.yourdomain.com`.
