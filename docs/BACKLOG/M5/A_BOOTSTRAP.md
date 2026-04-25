# Slice A — Bootstrap (foundations)

> Без этого slice ни один другой не может стартовать. Это репо-скаффолд, инфраструктура, CI.
> Goal: «`pnpm dev` поднимает API + web; `docker compose up` поднимает Postgres + Redis; CI зелёный на пустом приложении».

## IH-M5-A-001 — chore(repo): scaffold pnpm workspaces

- **Type:** chore — **Estimate:** 3h — **Owner:** dev — **Deps:** —
- **Acceptance:**
  - [ ] `pnpm-workspace.yaml` с `apps/*` и `packages/*`
  - [ ] `apps/api`, `apps/web`, `apps/mobile`, `packages/shared`, `packages/ui` созданы (пустые package.json)
  - [ ] `pnpm install` без ошибок
  - [ ] Корневой `package.json` с скриптами `dev`, `build`, `lint`, `test`
- **Files:** `pnpm-workspace.yaml`, `package.json`, `apps/*/package.json`
- **Labels:** `area:repo`, `slice:A`, `priority:p0`, `type:chore`

## IH-M5-A-002 — chore(repo): TypeScript базовая конфигурация

- **Type:** chore — **Estimate:** 2h — **Owner:** dev — **Deps:** A-001
- **Acceptance:**
  - [ ] `tsconfig.base.json` в корне, `strict: true`, `noUncheckedIndexedAccess: true`
  - [ ] Каждый workspace расширяет base
  - [ ] `pnpm tsc -b` чистый
- **Files:** `tsconfig.base.json`, `apps/*/tsconfig.json`
- **Labels:** `area:repo`, `slice:A`, `priority:p0`, `type:chore`

## IH-M5-A-003 — chore(repo): ESLint + Prettier

- **Type:** chore — **Estimate:** 2h — **Owner:** dev — **Deps:** A-002
- **Acceptance:**
  - [ ] `eslint.config.mjs` с `@typescript-eslint`, `eslint-plugin-import`
  - [ ] `.prettierrc` (single quote, 100 cols, trailing comma all)
  - [ ] `pnpm lint` и `pnpm format:check` зелёные
- **Files:** `eslint.config.mjs`, `.prettierrc`, `.editorconfig`
- **Labels:** `area:repo`, `slice:A`, `priority:p0`, `type:chore`

## IH-M5-A-004 — chore(ci): GitHub Actions — lint, type-check, test

- **Type:** chore — **Estimate:** 3h — **Owner:** devops — **Deps:** A-003
- **Acceptance:**
  - [ ] `.github/workflows/ci.yml` с jobs: install, lint, type-check, test
  - [ ] Запуск на push и PR в любую ветку
  - [ ] Зелёный на пустом приложении
  - [ ] Кеш pnpm-store
- **Files:** `.github/workflows/ci.yml`
- **Labels:** `area:ci`, `slice:A`, `priority:p0`, `type:chore`

## IH-M5-A-005 — chore(infra): docker-compose для локальной разработки

- **Type:** chore — **Estimate:** 4h — **Owner:** devops — **Deps:** —
- **Acceptance:**
  - [ ] `docker-compose.yml` с сервисами: `postgres:15`, `redis:7-alpine`, `minio` (S3-совместимый локально)
  - [ ] Volumes для persistence
  - [ ] Healthchecks
  - [ ] `make up` / `make down` шорткаты (или npm scripts)
  - [ ] README раздел «Локальная разработка»
- **Files:** `docker-compose.yml`, `Makefile`, `README.md`
- **Labels:** `area:infra`, `slice:A`, `priority:p0`, `type:chore`

## IH-M5-A-006 — chore(api): NestJS scaffold с health endpoint

- **Type:** chore — **Estimate:** 4h — **Owner:** backend — **Deps:** A-002, A-005
- **Acceptance:**
  - [ ] NestJS app в `apps/api` с `@nestjs/core`, `@nestjs/common`, `@nestjs/config`
  - [ ] `GET /health` → `{ status: 'ok', uptime, version }`
  - [ ] `GET /readiness` → проверяет Postgres+Redis
  - [ ] Структура: `apps/api/src/modules/<module-name>/...`
  - [ ] `pnpm dev:api` поднимает на :4000
- **Files:** `apps/api/src/main.ts`, `apps/api/src/app.module.ts`, `apps/api/src/modules/health/*`
- **Labels:** `area:api`, `slice:A`, `priority:p0`, `type:chore`
- **Notes:** Структура модулей соответствует [`docs/ARCH/MICROSERVICES.md`](../../ARCH/MICROSERVICES.md). Каждый модуль = future microservice.

## IH-M5-A-007 — chore(api): Prisma + первая миграция (пустая)

- **Type:** chore — **Estimate:** 3h — **Owner:** backend — **Deps:** A-006
- **Acceptance:**
  - [ ] `prisma/schema.prisma` с datasource Postgres + generator client
  - [ ] `prisma migrate dev` создаёт миграцию `0_init`
  - [ ] `PrismaService` в `apps/api/src/common/prisma`
  - [ ] `prisma migrate deploy` запускается из CI
- **Files:** `apps/api/prisma/schema.prisma`, `apps/api/src/common/prisma/*`
- **Labels:** `area:api`, `slice:A`, `priority:p0`, `type:chore`

## IH-M5-A-008 — chore(api): Redis + events-bus подключение

- **Type:** chore — **Estimate:** 4h — **Owner:** backend — **Deps:** A-006
- **Acceptance:**
  - [ ] `ioredis` подключён, `RedisService` в `apps/api/src/common/redis`
  - [ ] `EventsBusService` с методами `publish(event)` и `subscribe(type, handler)` поверх Redis Streams
  - [ ] Поддержка consumer groups
  - [ ] Healthcheck эндпоинт показывает Redis status
- **Files:** `apps/api/src/common/events-bus/*`, `apps/api/src/common/redis/*`
- **Labels:** `area:api`, `slice:A`, `priority:p0`, `type:chore`
- **Notes:** Соответствует [`docs/ARCH/EVENTS.md`](../../ARCH/EVENTS.md).

## IH-M5-A-009 — chore(api): Transactional outbox pattern

- **Type:** chore — **Estimate:** 6h — **Owner:** backend — **Deps:** A-007, A-008
- **Acceptance:**
  - [ ] Таблица `outbox_entries` (id, event_type, payload, schema_version, created_at, published_at)
  - [ ] `OutboxService` пишет в outbox в рамках транзакции
  - [ ] Outbox-relay воркер (отдельный inProcess) забирает unpublished, публикует в Redis, помечает `published_at`
  - [ ] Idempotency: `event.id` UUIDv4 на этапе записи в outbox
  - [ ] Тесты: rollback транзакции → запись в outbox откатилась
- **Files:** `apps/api/src/common/outbox/*`, миграция Prisma
- **Labels:** `area:api`, `slice:A`, `priority:p0`, `type:chore`
- **Notes:** Без этого ничего публиковать в шину НЕЛЬЗЯ. См. [`EVENTS.md` § Сначала commit DB, потом publish](../../ARCH/EVENTS.md).

## IH-M5-A-010 — chore(api): processed_events для идемпотентности подписчиков

- **Type:** chore — **Estimate:** 3h — **Owner:** backend — **Deps:** A-008
- **Acceptance:**
  - [ ] Таблица `processed_events (event_id, consumer, processed_at)`
  - [ ] `EventSubscriber`-декоратор обворачивает handler в idempotency-check
  - [ ] TTL 30 дней через scheduled job
  - [ ] Тест: повторная отправка того же event.id → handler не вызывается
- **Files:** `apps/api/src/common/events-bus/idempotency.ts`, миграция Prisma
- **Labels:** `area:api`, `slice:A`, `priority:p0`, `type:chore`

## IH-M5-A-011 — chore(web): Next.js 14 scaffold с App Router

- **Type:** chore — **Estimate:** 4h — **Owner:** frontend — **Deps:** A-001, A-002
- **Acceptance:**
  - [ ] Next.js 14 в `apps/web` с App Router
  - [ ] Tailwind CSS + shadcn/ui (init)
  - [ ] `/` отображает «IndiaHorizone — Trip Dashboard»
  - [ ] `pnpm dev:web` поднимает на :3000
  - [ ] Базовый layout с русской локалью
- **Files:** `apps/web/app/*`, `apps/web/tailwind.config.ts`
- **Labels:** `area:web`, `slice:A`, `priority:p0`, `type:chore`

## IH-M5-A-012 — chore(web): Service Worker + PWA manifest

- **Type:** chore — **Estimate:** 4h — **Owner:** frontend — **Deps:** A-011
- **Acceptance:**
  - [ ] `manifest.webmanifest` (name, icons, display: standalone)
  - [ ] Workbox + next-pwa подключён
  - [ ] App-shell кешируется после первого визита
  - [ ] Lighthouse PWA-score > 90
  - [ ] iOS Safari «Добавить на главный экран» работает
- **Files:** `apps/web/public/manifest.webmanifest`, `apps/web/next.config.mjs`
- **Labels:** `area:web`, `slice:A`, `priority:p0`, `type:chore`
- **Notes:** Базис для offline-first; полное cache strategy — в slice D.

## IH-M5-A-013 — chore(web): React Query + axios + correlation-id

- **Type:** chore — **Estimate:** 3h — **Owner:** frontend — **Deps:** A-011
- **Acceptance:**
  - [ ] `@tanstack/react-query` v5 подключён
  - [ ] axios-инстанс с baseURL из env
  - [ ] Interceptor добавляет `X-Correlation-Id` (UUID на запрос)
  - [ ] React Query DevTools в dev-режиме
- **Files:** `apps/web/lib/api/client.ts`, `apps/web/lib/query.ts`
- **Labels:** `area:web`, `slice:A`, `priority:p0`, `type:chore`

## IH-M5-A-014 — chore(observability): Pino logger + correlation-id middleware

- **Type:** chore — **Estimate:** 3h — **Owner:** backend — **Deps:** A-006
- **Acceptance:**
  - [ ] `nestjs-pino` подключён
  - [ ] Middleware читает / генерирует `X-Correlation-Id`, прокидывает в logger context
  - [ ] Все логи в JSON-формате
  - [ ] PII-фильтр (паспорт, токены) в `redact: [...]`
- **Files:** `apps/api/src/common/logger/*`, `apps/api/src/common/middleware/correlation.ts`
- **Labels:** `area:api`, `slice:A`, `priority:p0`, `type:chore`

## IH-M5-A-015 — chore(observability): Prometheus метрики baseline

- **Type:** chore — **Estimate:** 3h — **Owner:** backend — **Deps:** A-006
- **Acceptance:**
  - [ ] `prom-client` подключён
  - [ ] `GET /metrics` (защищён internal-token)
  - [ ] Default metrics + `http_request_duration_seconds`
  - [ ] Лейблы: `method`, `route`, `status`
- **Files:** `apps/api/src/common/metrics/*`
- **Labels:** `area:api`, `slice:A`, `priority:p1`, `type:chore`

## Slice A — итог

15 issues, оценка ≈ 51 часа (≈ 1.5 недели одного dev fullstack).

**Definition of Done slice A:**
- `pnpm dev` поднимает API + web
- `docker compose up` поднимает Postgres + Redis + MinIO
- CI зелёный
- Базовая инфраструктура для events, outbox, idempotency, метрик, логов готова
- Можно начинать slice B (auth)
