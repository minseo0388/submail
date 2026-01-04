# Submail System

A Discord-gated email alias system that allows users to create email aliases (e.g., `user@example.com`) which forward to their real email or block spam.

## Features

-   **Discord Authentication**: Gate access to users in your Discord server.
-   **Security**: Verify Discord Guild Membership to restrict access.
-   **Email Aliasing**: Create aliases like `netflix@yourdomain.com` -> `your.real.email@gmail.com`.
-   **Custom Destinations**: Route specific aliases to different email addresses (e.g. work vs personal).
-   **Rule Engine**: Block or Forward emails per alias (Pause/Resume).
-   **Activity Logs**: View history of forwarded/blocked emails on Dashboard.
-   **SMTP Server**: Built-in NodeJS SMTP server to handle incoming mail.

---

## Docker Deployment (Recommended)

Run the entire system with a single command.

1.  **Configure Environment**:
    Copy `.env.example` to `.env` and fill in your values.

2.  **Run with Docker Compose**:
    ```bash
    docker-compose up -d --build
    ```

3.  **Access**:
    -   **Dashboard**: `http://localhost:3000`
    -   **SMTP Server**: Port `25`
    -   **Database**: Persisted in `./docker-data`

---

## Getting Started (Local Development)

Follow these steps to run the project on your personal computer for testing.

### 1. Prerequisites
-   **Node.js**: Version 18 or higher ([Download](https://nodejs.org/)).
-   **Discord Application**: Create one at the [Discord Developer Portal](https://discord.com/developers/applications).
    -   Get **Client ID** & **Client Secret** (OAuth2 settings).
    -   Get **Bot Token** (Bot settings).
    -   Add Redirect URI: `http://localhost:3000/api/auth/callback/discord`.

### 2. Installation
Clone the repo and install dependencies:
```bash
git clone https://github.com/minseo0388/submail.git
cd submail
npm install
```

### 3. Configuration (.env)
This project uses a single configuration file for both the Web Dashboard and the Mail Bot.

Copy the example file and edit it:
```bash
cp .env.example .env
```
Fill in your keys in the root `.env` file:
```properties
# Discord (From Developer Portal)
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_GUILD_ID=your_target_server_id # REQUIRED: Only members of this server can login


# SMTP
SMTP_PORT=25
SMTP_DOMAIN=example.com  # Change to your local testing domain if needed

# Web
WEB_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=random_string_here
```

### 4. Database Setup
Initialize the local SQLite database:
```bash
npx prisma generate
npx prisma db push
```

### 5. Run it!
Open two terminal windows:

**Terminal 1 (Web Dashboard):**
```bash
npm run dev --workspace=apps/web
```
(Visit `http://localhost:3000`)

**Terminal 2 (Bot & SMTP):**
```bash
npm run dev --workspace=apps/bot
```
*(Note: Binding to port 25 might fail on some systems without permissions. You can change `SMTP_PORT` to 2525 in `.env` for testing).*

---

## Deployment Guide (Server/VPS)

To run this for real users, you need a server (VPS) like AWS EC2, DigitalOcean, or Vultr.

### 1. Prepare the Server
Assuming you use **Ubuntu**:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

### 3. DKIM Setup (Recommended for Deliverability)
To prevent your emails from landing in spam folders, set up DKIM.
1.  Install OpenDKIM tools:
    ```bash
    sudo apt install opendkim-tools
    ```
2.  Generate a key pair:
    ```bash
    opendkim-genkey -s default -d yourdomain.com
    ```
3.  Add the key path to `.env`:
    ```properties
    DKIM_PRIVATE_KEY_PATH="./default.private"
    DKIM_KEY_SELECTOR="default"
    ```
4.  **DNS Record**: Add a TXT record for `default._domainkey` with the content of `default.txt` (generated in step 2).

### 2. Download Code & Install
```bash
git clone https://github.com/minseo0388/submail.git /var/www/submail
cd /var/www/submail
npm install
npm run build
```

### 3. Production Configuration
Create your `.env` file just like in local setup, but change the URLs:
```properties
SMTP_DOMAIN=yourdomain.com
WEB_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
DATABASE_URL="file:./prod.db"
```

### 4. Handling Port 25 (SMTP)
Node.js cannot bind to port 25 (privileged) without root.
**Option A: Give Node permissions (Recommended)**
```bash
sudo setcap 'cap_net_bind_service=+ep' $(which node)
```
**Option B: Use Authbind**
```bash
sudo apt install authbind
sudo touch /etc/authbind/byport/25
sudo chmod 500 /etc/authbind/byport/25
sudo chown username /etc/authbind/byport/25
# Run app with: authbind --deep npm run start --workspace=apps/bot
```

### 5. Running with PM2
Start both services in the background so they restart on reboot.

```bash
# Start Web App
cd /var/www/submail/apps/web
pm2 start npm --name "submail-web" -- start

# Start Bot (Requires Port 25 permission from step 4)
cd /var/www/submail/apps/bot
pm2 start npm --name "submail-bot" -- start
```
Save the process list:
```bash
pm2 save
pm2 startup
```

### 6. DNS Configuration (Important!)
Go to your Domain Registrar (Namecheap, GoDaddy, Cloudflare) and set these records:

| Type | Name | Content | Priority |
|------|------|---------|----------|
| **A** | `@` | `YOUR_SERVER_IP` | - |
| **MX** | `@` | `yourdomain.com` | 10 |
| **A** | `www` | `YOUR_SERVER_IP` | - |

*(Alternatively, you can create a subdomain like `mail.yourdomain.com` for the MX record if you prefer)*.

### 7. Reverse Proxy (Optional but Recommended)
Use **Nginx** or **Caddy** to handle HTTPS/SSL for the web dashboard (`http://localhost:3000` -> `https://yourdomain.com`).

---

## License
GNU GPLv3
