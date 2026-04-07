FROM node:22-alpine AS base

# --- Dependencies (cached separately) ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN npx prisma generate

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="mysql://build:build@localhost:3306/build"
ENV JWT_SECRET="build-time-placeholder"
RUN npm run build

# --- Production ---
FROM base AS runner
WORKDIR /app

# FFmpeg + fonts only in runner (not needed for build)
RUN apk add --no-cache ffmpeg font-noto fontconfig

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Public assets
COPY --from=builder /app/public ./public

# Standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Full node_modules (needed for Prisma CLI at startup)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Entrypoint
COPY --chown=nextjs:nodejs entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

RUN mkdir -p /app/public/uploads /app/public/audio && chown -R nextjs:nodejs /app/public/uploads /app/public/audio

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./entrypoint.sh"]
