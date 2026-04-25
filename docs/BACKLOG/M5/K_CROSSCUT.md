# Slice K — Cross-cutting (audit, observability, security, deploy)

> Goal: «Audit-log включён везде, метрики и трейсы есть, secrets через Vault, dev → staging → prod пайплайн».
> Покрывает [`docs/ARCH/SECURITY/`](../../ARCH/SECURITY/), [`MICROSERVICES.md § 9 audit-svc`](../../ARCH/MICROSERVICES.md), [`EVENTS.md` § DLQ + мониторинг](../../ARCH/EVENTS.md).

## IH-M5-K-001 — feat(audit): wildcard subscriber на все события

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** A-008, A-010
- **Acceptance:**
  - [ ] `AuditEventListener` подписан на `*`
  - [ ] Append-only `audit_events` (event_id, type, actor, payload, occurred_at, recorded_at)
  - [ ] Index по actor + occurred_at, по type + occurred_at
  - [ ] Тест: запись не может быть удалена через ORM (Prisma raw-block)
- **Files:** `apps/api/src/modules/audit/*`
- **Labels:** `area:audit`, `slice:K`, `priority:p0`, `type:feat`
- **Notes:** См. [`SECURITY/AUDIT_LOG.md`](../../ARCH/SECURITY/AUDIT_LOG.md).

## IH-M5-K-002 — feat(audit): admin endpoint для просмотра

- **Type:** feat — **Estimate:** 3h — **Owner:** backend — **Deps:** K-001
- **Acceptance:**
  - [ ] `GET /audit?actor=...&object=...&from=...&to=...` (только admin)
  - [ ] Pagination cursor-based
  - [ ] Сам факт чтения audit-log пишется в audit-log (recursive but ok)
- **Files:** `apps/api/src/modules/audit/audit.controller.ts`
- **Labels:** `area:audit`, `slice:K`, `priority:p1`, `type:feat`

## IH-M5-K-003 — feat(secrets): Vault / KMS интеграция

- **Type:** feat — **Estimate:** 6h — **Owner:** devops — **Deps:** A-006
- **Acceptance:**
  - [ ] `SecretsService` с провайдерами: `EnvProvider` (dev), `VaultProvider` (prod) или `AwsKmsProvider`
  - [ ] Выбирается через env `SECRETS_PROVIDER`
  - [ ] Секреты лениво загружаются + кешируются с TTL
  - [ ] Поддержка ротации (cache-busting через event)
  - [ ] Список секретов: DB password, JWT keys, master encryption key, API keys (FCM, APNs, Telegram, S3, payment)
- **Files:** `apps/api/src/common/secrets/*`, `infra/vault/`
- **Labels:** `area:security`, `slice:K`, `priority:p0`, `type:feat`
- **Notes:** См. [`SECURITY/SECRETS.md`](../../ARCH/SECURITY/SECRETS.md).

## IH-M5-K-004 — feat(security): rate-limit на gateway

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** A-006
- **Acceptance:**
  - [ ] `@nestjs/throttler` + Redis store
  - [ ] Профили: `auth` (10/min/IP), `api` (100/min/user), `sos` (no limit), `media-upload` (20/min/user)
  - [ ] При превышении — 429 + `Retry-After`
  - [ ] Bypass для internal-tokenов (для health/metrics)
- **Files:** `apps/api/src/common/throttle/*`
- **Labels:** `area:security`, `slice:K`, `priority:p0`, `type:feat`

## IH-M5-K-005 — feat(security): шифрование IndexedDB на устройстве

- **Type:** feat — **Estimate:** 6h — **Owner:** frontend — **Deps:** D-009
- **Acceptance:**
  - [ ] Session-key получается при login (на сервере) → хранится в `sessionStorage` (не persistent)
  - [ ] Все записи в IndexedDB шифруются AES-GCM с этим ключом
  - [ ] При logout — IndexedDB wipe
  - [ ] При истечении токена — wipe чувствительных таблиц
- **Files:** `apps/web/lib/offline/encryption.ts`
- **Labels:** `area:security`, `slice:K`, `priority:p1`, `type:feat`
- **Notes:** Соответствует [`OFFLINE.md` § Безопасность offline](../../ARCH/OFFLINE.md). Для PWA это не SQLCipher-аналог, но защита от случайного просмотра при потере телефона.

## IH-M5-K-006 — feat(observability): OpenTelemetry traces

- **Type:** feat — **Estimate:** 5h — **Owner:** backend — **Deps:** A-014
- **Acceptance:**
  - [ ] `@opentelemetry/sdk-node` подключён
  - [ ] Auto-instrument: HTTP, Postgres (Prisma), Redis, S3
  - [ ] Trace context propagation через `traceparent` header
  - [ ] Export в Jaeger / OTLP collector
  - [ ] Span на каждый event-handler с тегами (consumer, event-type)
- **Files:** `apps/api/src/common/tracing/*`
- **Labels:** `area:observability`, `slice:K`, `priority:p1`, `type:feat`

## IH-M5-K-007 — feat(observability): Grafana dashboards (manifests)

- **Type:** feat — **Estimate:** 6h — **Owner:** devops — **Deps:** A-015
- **Acceptance:**
  - [ ] JSON-манифесты дашбордов в `infra/grafana/dashboards/`
  - [ ] Дашборды: `api-overview`, `events-bus`, `circle`, `sos`, `auth`, `finance`
  - [ ] Алерты: API 5xx > 1%, event lag > 1000, SOS lag > 5s, DLQ > 10
  - [ ] Provisioning через configmap
- **Files:** `infra/grafana/*`
- **Labels:** `area:observability`, `slice:K`, `priority:p1`, `type:feat`

## IH-M5-K-008 — feat(deploy): staging environment

- **Type:** feat — **Estimate:** 8h — **Owner:** devops — **Deps:** A-004
- **Acceptance:**
  - [ ] Деплой на fly.io / Hetzner (TBD)
  - [ ] Workflow `deploy-staging.yml` — merge в `main` → деплой
  - [ ] Postgres + Redis managed
  - [ ] Domain `staging.indiahorizone.ru` (или `.ru` subdomain)
  - [ ] Smoke-test после деплоя (health + readiness + login flow)
- **Files:** `.github/workflows/deploy-staging.yml`, `infra/fly/`
- **Labels:** `area:deploy`, `slice:K`, `priority:p0`, `type:feat`

## IH-M5-K-009 — feat(deploy): production environment

- **Type:** feat — **Estimate:** 6h — **Owner:** devops — **Deps:** K-008
- **Acceptance:**
  - [ ] Workflow `deploy-prod.yml` — manual trigger (workflow_dispatch)
  - [ ] Backup Postgres до деплоя (`pg_dump → S3`)
  - [ ] Health-check после деплоя, при failure — авто-rollback
  - [ ] Domain `app.indiahorizone.ru`
  - [ ] HTTPS через Caddy / fly auto-certs
- **Files:** `.github/workflows/deploy-prod.yml`
- **Labels:** `area:deploy`, `slice:K`, `priority:p0`, `type:feat`

## IH-M5-K-010 — feat(deploy): backup и DR-проверки

- **Type:** feat — **Estimate:** 4h — **Owner:** devops — **Deps:** K-009
- **Acceptance:**
  - [ ] Daily Postgres backup в S3 (encrypted)
  - [ ] Retention 30 дней
  - [ ] Quarterly DR-drill: restore из backup в staging
  - [ ] Документ `docs/OPS/DR.md` с runbook'ом
- **Files:** `infra/backup/*`, `docs/OPS/DR.md`
- **Labels:** `area:deploy`, `slice:K`, `priority:p1`, `type:feat`
- **Notes:** В travel — потеря данных = регуляторный + репутационный удар. DR-drill 4×/год минимум.

## IH-M5-K-011 — feat(security): pen-test + vulnerability scan baseline

- **Type:** feat — **Estimate:** 4h — **Owner:** devops — **Deps:** K-009
- **Acceptance:**
  - [ ] OWASP ZAP / Snyk в CI
  - [ ] Dependency audit: `pnpm audit` блокирует merge при High/Critical
  - [ ] Quarterly: внешний pen-test (раз в 3 мес после prod)
  - [ ] Документ `docs/OPS/SECURITY_AUDIT.md` со списком чек-листов
- **Files:** `.github/workflows/security.yml`
- **Labels:** `area:security`, `slice:K`, `priority:p1`, `type:feat`

## Slice K — итог

11 issues, ≈ 56 часов.

**DoD:** audit включён, secrets через Vault/KMS, rate-limit, encryption client-side, traces+metrics+dashboards, staging+prod, backup+DR, security baseline.
