# syntax=docker/dockerfile:1.7
# IndiaHorizone — apps/api Dockerfile (multi-stage, pnpm monorepo, NestJS + Prisma)
#
# Build context: корень monorepo (см. /opt/indiahorizone/docker-compose.dev.yml).
# Issue: #329 [devops:vika], #320, EPIC 6.
#
# Stages:
#   1. base    — node:20-alpine + openssl (для Prisma) + corepack (pnpm)
#   2. deps    — install api-subgraph (web исключаем, он в apps/web/Dockerfile)
#   3. builder — shared build → prisma generate → nest build
#   4. runner  — Node 20 alpine + код из builder + healthcheck

# ────────────────────────── 1. base
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /repo
RUN corepack enable

# ────────────────────────── 2. deps (api subgraph)
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json
# Prisma schema нужна сейчас — apps/api postinstall запустит `prisma generate`
# (генератор кладёт client рядом с @prisma/client в node_modules).
COPY apps/api/prisma ./apps/api/prisma
# Ставим только подграф api (web исключён — у него свой Dockerfile).
# `@indiahorizone/api...` = api + транзитивно shared.
RUN pnpm install --frozen-lockfile --prefer-offline --filter "@indiahorizone/api..."

# ────────────────────────── 3. builder
FROM base AS builder
COPY --from=deps /repo /repo
COPY . .
ENV NODE_ENV=production
RUN pnpm --filter @indiahorizone/shared build
RUN pnpm --filter @indiahorizone/api build

# ────────────────────────── 4. runner
# рекомендация: для prod-образа — отдельный slim-runner через `pnpm deploy --prod`
# (только prod node_modules + dist/ + prisma client = ~200 MB). Сейчас dev-pilot,
# тащим весь monorepo из builder для надёжной работы Prisma + pnpm symlinks
# (~700 MB). Slim-вариант — отдельный issue фазы 4 после стабилизации dev.
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl wget && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs
WORKDIR /app

ENV NODE_ENV=production
ENV API_HOST=0.0.0.0
ENV API_PORT=4000

COPY --from=builder --chown=nestjs:nodejs /repo /app

USER nestjs
WORKDIR /app/apps/api
EXPOSE 4000

# Healthcheck: GET /health (NestJS health.controller — проверяет prisma + redis)
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "dist/main.js"]
