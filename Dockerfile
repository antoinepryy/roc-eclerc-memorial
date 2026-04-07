# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app

# --- Dependencies (maximally cached) ---
FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# --- Prisma generate (cached unless schema changes) ---
FROM base AS prisma
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN npx prisma generate

# --- Build Next.js ---
FROM base AS builder
COPY --from=prisma /app/node_modules ./node_modules
COPY --from=prisma /app/src/generated ./src/generated
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="mysql://build:build@localhost:3306/build"
ENV JWT_SECRET="build-time-placeholder"

RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# --- Production image (minimal) ---
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache ffmpeg font-noto fontconfig && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/public/uploads /app/public/audio && \
    chown -R nextjs:nodejs /app/public

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Public assets (images only, audio on S3)
COPY --from=builder /app/public ./public

# Standalone Next.js output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma (for migrations at startup)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=prisma /app/src/generated ./src/generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Entrypoint
COPY --chown=nextjs:nodejs entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000

CMD ["./entrypoint.sh"]
