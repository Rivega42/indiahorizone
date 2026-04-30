# DevOps правила

> Стандарты практик инфраструктуры. Применяются Викой при выполнении devops-задач + Claude Code при описании deployment-процессов.

## Окружения

| Окружение | URL | Auto-deploy | Approval | DB |
|---|---|---|---|---|
| **dev** | http://2.56.241.126:3010 (web), :3011 (api) | да, на push в main | нет | dev-postgres контейнер |
| **staging** | (не существует) | — | — | — |
| **production** | (не существует) | manual workflow_dispatch + tag `v*` | founders (Roman) | TBD |

Phase 3 — только dev. Staging/prod создаются перед public launch (см. ROADMAP).

## Деплой

### Dev (текущий)

- Триггер: push в `main` → workflow `deploy-dev.yml` → SSH на 2.56.241.126 → `git pull && docker compose up -d --build`
- Лог: GitHub Actions logs + `docker logs <container>` на сервере

### Production (когда появится)

- Триггер: tag `v*` (semver) + manual approval founders
- Procedure: blue-green / rolling update через docker compose / k8s (TBD)
- Rollback: revert tag → re-deploy предыдущий

## Migrations

### Применение

```bash
# На сервере, в контейнере api:
docker compose exec api pnpm exec prisma migrate deploy
```

- **Никогда** `prisma migrate dev` в production — он создаёт shadow database и может изменить state.
- **Всегда** `migrate deploy` — применяет только pending migrations линейно.

### Создание (разработчик)

```bash
# Локально:
pnpm --filter @indiahorizone/api exec prisma migrate dev --name <description>
# Создаст migration в apps/api/prisma/migrations/<timestamp>_<description>/migration.sql
# Commit'им в PR вместе с code-change'ом.
```

### CI check

`prisma-check.yml` workflow проверяет на каждом schema-touching PR:
- Apply all migrations к чистой БД
- `prisma migrate diff --exit-code` → должно быть 0

При drift'е — фикс должен быть в этом же PR. Issue для Vика только если drift сложный (`gen_random_uuid()` mismatch, JSONB type drift) — было в #373.

## Secrets management

### Текущий state

- `.env.example` в репо — шаблон без values
- `.env` локально (gitignored)
- На dev-сервере — env-файл, управляется Викой
- **Production** — Vault (ещё не настроен, #220)

### Pre-launch требование

До production launch:
1. Vault setup (#220)
2. Все production secrets из `.env.example` положены в Vault
3. App reads через Vault SDK или env-injection (TBD стратегия)
4. Rotation policy: каждые 90 дней для long-lived (DB, JWT_SECRET) + при компрометации

### Что НИКОГДА не делать

- Коммитить `.env` в git
- Печатать секреты в логи (даже DEBUG)
- Хранить secrets в browser localStorage / cookies non-httpOnly
- Reuse одного и того же secret между окружениями (dev/staging/prod должны быть разные)

## Resilience / SLA

### Dev (текущий)

- SLA: best-effort (founder + Vика делают по мере возможности)
- Backups: регулярные snapshots контейнера postgres (Vика управляет)
- Monitoring: pino-логи + manual review

### Production (когда будет)

- SLA: 99.5% uptime (≈3.6 часа downtime/месяц)
- Healthcheck endpoints (`/health`) — у API уже есть (`HealthModule` #129+)
- Alerts: Telegram-канал для дежурного при healthcheck-fail / 5xx > 1%/мин
- Backups: ежедневные DB snapshots с retention 30 дней
- Disaster recovery: documented runbook

## CI/CD principles

- **Все** PR'ы проходят CI (lint + format + type-check + tests + build)
- **Schema-touching** PR'ы дополнительно — prisma-check
- **Frontend changes** — build verify + Lighthouse weekly
- Никаких manual interventions в CI workflows без изменения yaml через PR
- Workflow files изменяются через PR + review (т.к. `.github/workflows/*` — это код)

## Branch protection (после ШАГ 8)

`main` будет защищён:
- Required status checks: `Lint + Format + Type-check + Tests`, `prisma-check` (для schema-PR'ов), `validate-issue` (метаданные)
- Linear history (no merge commits — squash only)
- No force-pushes
- No deletions
- 1 review (или founder approve через CODEOWNERS)
- Dismiss stale reviews on push
- Require conversation resolution

## On-call (когда появится prod)

Ротация: founder (Roman) + Vика. SOS-incidents — отдельная процедура (`docs/SOS/PLAYBOOKS/`).

## Связанные документы

- `docs/ai/VIKA_RULES.md` — что делает Vика
- `SECURITY.md` — security policy
- `STATE.md` — текущее состояние
- `docs/ARCH/SECURITY/` — архитектура безопасности
