# syntax=docker/dockerfile:1.7
# IndiaHorizone — apps/web Dockerfile (multi-stage, pnpm monorepo, Next.js standalone)
#
# Build context: корень monorepo (см. docker-compose.dev.yml).
# Issue: #320 [devops:vika], EPIC 13 deploy.
#
# Stages:
#   1. base    — node:20-alpine + corepack (pnpm)
#   2. deps    — install pnpm deps по lock-файлу (фрозен)
#   3. builder — pnpm build → .next/standalone + .next/static
#   4. runner  — минимальный runtime: только то что нужно server.js'у
#
# Размер runner-образа целевой: ≤ 200 MB. Без pnpm/dev-deps.

# ────────────────────────── 1. base
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /repo
RUN corepack enable

# ────────────────────────── 2. deps (frozen install с workspace)
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN pnpm install --frozen-lockfile --prefer-offline

# ────────────────────────── 3. builder
FROM base AS builder
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/web/node_modules ./apps/web/node_modules 2>/dev/null || true
COPY --from=deps /repo/packages/shared/node_modules ./packages/shared/node_modules 2>/dev/null || true
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Build shared package (TypeScript references)
RUN pnpm --filter @indiahorizone/shared build || true
# Build web (next standalone-output)
RUN pnpm --filter @indiahorizone/web build

# ────────────────────────── 4. runner (минимальный runtime)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Не root:
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Standalone output: server.js + минимальные node_modules + public/static
# Структура: /app/server.js, /app/apps/web/.next/static, /app/apps/web/public
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000

# Healthcheck: GET / должен возвращать 200
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "apps/web/server.js"]
