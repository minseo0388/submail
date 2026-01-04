FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY apps/bot/package.json ./apps/bot/package.json

# Install all dependencies (including dev deps for building TS)
RUN npm ci

# Copy source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Bot
WORKDIR /app/apps/bot
RUN npm run build

# Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Copy built artifacts and necessary files
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/bot/dist ./apps/bot/dist
COPY --from=base /app/apps/bot/package.json ./apps/bot/package.json
COPY --from=base /app/packages ./packages
COPY --from=base /app/package.json ./package.json

# We need Prisma Client
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/node_modules/@prisma ./node_modules/@prisma

WORKDIR /app/apps/bot
ENV NODE_ENV production

# SMTP Port
EXPOSE 25

CMD ["npm", "start"]
