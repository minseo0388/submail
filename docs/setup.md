# Development Setup Guide

This guide covers how to set up Submail on your local machine for development purposes.

## Prerequisites

-   **Node.js**: v20 or higher (v22 Recommended).
-   **npm**: Comes with Node.js.
-   **Discord Account**: For creating a customized application.

## Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone https://github.com/minseo0388/submail.git
cd submail
```

### 2. Install Dependencies

Submail uses a monorepo structure. Run `npm install` in the root directory to install dependencies for all workspaces.

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file to `.env`:

```bash
cp .env.example .env
```

Open `.env` and fill in the required fields. See the [Environment Variables](./env-vars.md) guide for details on getting your Discord keys.

### 4. Database Setup

Initialize the database (SQLite by default):

```bash
npx prisma db push
```

This command pushes the schema to your local database file (`dev.db`).

### 5. Start the Development Server

You can start both the web dashboard and the bot simultaneously:

```bash
npm run dev
```

-   **Web Dashboard**: [http://localhost:3000](http://localhost:3000)
-   **SMTP Server**: LISTENING on Port 25 (Requires root/admin privileges on some OS)

> **Note on Port 25**: Binding to port 25 often requires elevated privileges. On Linux/macOS, you might need to use `sudo` or set capabilities. On Windows, ensure no other service is using port 25.

### 6. Verify Installation

1.  Open [http://localhost:3000](http://localhost:3000).
2.  Log in with your Discord account.
3.  Create an alias.
4.  Send a test email to that alias (e.g., using `telnet localhost 25` or a mail client configured to use `localhost`).

## Turborepo

This project uses [Turborepo](https://turbo.build/) for build orchestration.

-   `npm run build`: Builds all apps.
-   `npm run lint`: Runs linters across the project.
