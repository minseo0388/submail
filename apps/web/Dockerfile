FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY apps/bot/package.json ./apps/bot/package.json

RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
# We need to set environment variables that might be required during build (like validation)
ENV NEXT_TELEMETRY_DISABLED 1
# Skip type checking during build for speed/simplicity in this setup, or ensure all types are valid
RUN cd apps/web && npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
# Note: We are not using standalone output yet for simplicity in monorepo, 
# but copying the necessary built artifacts. 
# Actually, standard next build produces .next. 
# For monorepo simple setup, we often just run `npm start` from the app dir if we have all deps.
# But `standalone` is better. Let's try to just run it with full source for now to ensure reliability without complex pruning.

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

WORKDIR /app/apps/web
EXPOSE 3000

ENV PORT 3000
# DATABASE_URL will be passed from docker-compose

CMD ["npm", "start"]
