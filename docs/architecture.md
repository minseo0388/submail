# Submail Architecture

Submail uses a hybrid architecture to provide both a modern web dashboard and a highly performant, custom-built SMTP server.

## 🏗️ System Overview

The system consists of two main logical components:

1.  **Web Dashboard (`apps/web`)**: A Next.js 14 application providing the user interface.
2.  **SMTP Bot (`apps/bot`)**: A Node.js application that handles incoming emails and Discord notifications.

### 🔄 Data Flow

1.  **User Action**: User logs in with Discord, creates an alias (e.g., `user@example.com`).
2.  **Data Storage**: Alias and session data is stored in the database (SQLite/PostgreSQL) via Prisma ORM.
3.  **Email Receipt**: Sender emails `user@example.com` → Reaches port 25 on the SMTP server.
4.  **Processing**: `apps/bot` receives the SMTP connection, validates the recipient alias against the DB.
5.  **Forwarding**: If valid, the email is parsed, and a summary is sent to the user's DM on Discord.

### 🛡️ Security Features

-   **Discord Gate**: Authentication is strictly handled via Discord OAuth2. Only members of a specific Guild can be allowed access.
-   **Content Security Policy (CSP)**: Strict headers to prevent XSS.
-   **HSTS**: Enforces HTTPS connections.
-   **PII Masking**: Functionality to mask personal information in logs.
-   **Rate Limiting**: Uses Upstash Redis to prevent abuse of API endpoints and email flooding.

### 🗄️ Database Schema

The database is managed by Prisma and shared between both apps. Key models include:

-   `User`: Stores Discord ID and profile info.
-   `Alias`: Stores created email aliases and their status (Active/Paused).
-   `Log`: Audit trail of processed emails.

## 🐳 Docker Architecture

In a Dockerized environment, both services run as separate containers but share the same network and database volume (if using SQLite).

-   `web` container: Exposes port 3000.
-   `bot` container: Exposes port 25.
