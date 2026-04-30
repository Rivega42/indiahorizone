# Аудит репозитория

> **Дата:** 2026-04-29
> **Аудитор:** Claude Code (по `REPO_SETUP_PROMPT.md`)
> **Ветка работы:** `chore/repo-setup`

## Контекст

| | |
|---|---|
| **Стек** | TypeScript monorepo (pnpm workspaces): NestJS API + Next.js 14 web + React Native mobile (placeholder) + shared packages. Prisma 5 + PostgreSQL 15 + Redis 7. |
| **Тип** | Travel-tech / India concierge. Tour catalog + lead-form → manager flow + push/email comm + planned trip dashboard. |
| **Стадия** | Phase 3 MVP. Backend M5 практически done (auth, clients, trips, comm, feedback, audit, push). Frontend tour-landing готов. SOS/Trip Dashboard frontend / 2FA UI впереди. |
| **Размер** | 200 source-файлов (`.ts/.tsx/.mjs/.js/.json`), 102 markdown-док, 177 коммитов в истории. |
| **Команда** | Roman (founder + tech lead), Shivam (sales + IN ops), Claude Code (senior dev AI), Vika (devops AI). |

## Сильные стороны (сохранить)

- **`CLAUDE.md`** (494 строки) — детальные принципы разработки, правила для Claude/Vika, формат issue для devops, иерархия issue (epic→issue→sub-issue). Не переписываем, ссылаемся.
- **`CONTRIBUTING.md`** (473 строки) — PR-чеклист, шаблон описания PR.
- **Структура `docs/`** — 18 поддиректорий с реальным контентом: `TZ/`, `ARCH/`, `UX/`, `LEGAL/`, `OPS/`, `SOS/`, `BUSINESS_MODEL/`, `LOYALTY/`, `BACKLOG/M5/`, `FINANCE/`. Нельзя ломать.
- **6 GitHub workflows** работают: `ci.yml` (Lint+Format+Type-check+Tests), `prisma-check.yml` (schema↔migrations sync), `lighthouse.yml` (mobile perf), `deploy-dev.yml`, `auto-label-pr.yml`, `project-automation.yml`.
- **3 issue templates**: `bug.yml`, `feature.yml`, `config.yml`.
- **`.github/CODEOWNERS`** + `pull_request_template.md` — есть.
- **`LICENSE`** — Proprietary (не open-source). Решение в силе.
- **GitHub Project уже работает** (https://github.com/users/Rivega42/projects/3, упомянут в `CLAUDE.md`) с лейблами P0/P1/P2, shivam, design, и т.п.
- **Иерархия issues** уже соблюдается: EPIC 6 (Архитектура), EPIC 12 (Tour Catalog), EPIC 13 (Homepage WIP).

## Существующие конвенции (уважать)

| Конвенция | Где зафиксирована |
|---|---|
| **Modular monolith** в фазе 3 → microservices в фазе 4 | `docs/ARCH/MICROSERVICES.md` + CLAUDE.md |
| **Cross-module FK запрещены** (только soft-references) | CLAUDE.md + schema.prisma комменты |
| **Outbox + processed_events** для idempotent events | `docs/ARCH/EVENTS.md` |
| **Conventional Commits** | CLAUDE.md § Git-воркфлоу |
| **Ветки:** `feature/*`, `fix/*`, `docs/*`, `chore/*`, `claude/*` | CLAUDE.md |
| **PR-чеклист**: lint + type-check + format-check + build + docs update | CONTRIBUTING.md |
| **`[devops:vika]` issues** для server-side actions | CLAUDE.md § 7 |
| **Запрет `--no-verify`, `--force-push` в main** | CLAUDE.md + tooling |
| **152-ФЗ + ПДн в РФ-облаке** | `docs/LEGAL/PDN.md` |
| **Schema.org TouristTrip + FAQPage**, OG, sitemap | shipped в #308 |
| **Prisma drift detection** workflow | shipped в #373 |

## Что сломано

- **`PROJECT_TOKEN`** secret для `project-automation.yml` workflow — невалидный/expired (см. failing checks на каждом PR'е). Pre-existing, не код, отдельный issue для Вики на ротацию.
- **Schema-drift CI** — проверяет на каждом schema-touching PR. Сейчас clean после #373, но workflow всё ещё помечается warn-only. Не блокер.
- Прочих регрессий не зафиксировано.

## Что отсутствует (gap для kit)

| Файл / директория | Статус | Приоритет |
|---|---|---|
| `STATE.md` | ❌ нет | P1 (трекинг состояния) |
| `DECISIONS.md` (ADR) | ❌ нет | P1 (история решений) |
| `CHANGELOG.md` | ❌ нет | P2 (release-please сгенерирует) |
| `ROADMAP.md` (root) | ❌ есть `docs/TZ/MVP_PHASE3.md` — partial overlap | P2 (создать с ссылкой на docs/) |
| `BACKLOG.md` (root) | ❌ есть `docs/BACKLOG/M5/` — partial overlap | P2 (создать как фасад) |
| `AUDIT.md` | ✅ этот файл | P1 (✅ done) |
| `SECURITY.md` | ❌ нет | P1 (responsible disclosure) |
| `.gitattributes` | ❌ нет | P3 (LF normalization) |
| `docs/ai/` (CLAUDE/VIKA/DEVOPS rules + AUTOMATION) | ❌ нет | P1 (правила для AI) |
| `docs/context/PRODUCT_CONTEXT.md`, `DOMAIN.md` | ❌ нет (есть `docs/TZ/`, не одно и то же) | P2 |
| `docs/prompts/` | ❌ нет | P3 |
| `docs/GLOSSARY.md` | ❌ нет (партиал в `docs/TZ/README.md`) | P2 |
| `scripts/` | ❌ нет директории | P1 (kit-важно) |
| `scripts/setup-labels.sh`, `setup-project.sh` | ❌ нет (Project уже создан, лейблы вручную) | P1 (kit) |
| `scripts/automation/*.mjs` (auto-labels, rollup, epic-sync, deps, validate, digest, notify) | ❌ нет | P1 (ядро kit) |
| `.github/workflows/auto-labels.yml`, `sub-issue-rollup.yml`, `epic-board-sync.yml`, `dependency-resolver.yml`, `validate-issue.yml`, `weekly-digest.yml`, `stale-cleanup.yml`, `notifications.yml`, `dashboard-sync.yml` | ❌ нет | P1 (kit) |
| `.github/workflows/release-please.yml`, `e2e.yml`, `deploy-staging.yml`, `deploy-prod.yml` | ❌ нет (есть только `deploy-dev.yml`) | P2 (нет staging/prod пока) |
| `.github/dependabot.yml`, `.github/labeler.yml`, `.github/markdown-link-check.json` | ❌ нет | P2 |
| `.github/ISSUE_TEMPLATE/epic.yml`, `task.yml`, `tech_debt.yml`, `vika_devops.yml` | ❌ нет (есть bug/feature/config) | P1 |
| `tools/dashboard/` | ❌ нет | P2 (дашборд опционально) |
| `_archive/` | ❌ нет | P3 (создаётся при первом archiving) |

## Технический долг

- **TODO/FIXME comments:** 10 штук в `apps/*` (приемлемо для phase 3).
- **Test coverage:** stub'ы в `pnpm test` — нет реальных юнит-тестов / e2e. Технический долг признан, отдельный backlog item.
- **`apps/mobile/`** — placeholder без кода. React Native setup — фаза 4.
- **Lint config**: единый eslint-config через monorepo, prettier + eslint-config-prettier — настроено корректно (#365).
- **Prisma client кэширование между PR'ами** — иногда нужен `prisma generate` руками после schema changes. Не блокер.

## Безопасность

- **Секреты в git history:** ⚠️ полноценный `gitleaks --all` НЕ запущен (нет binary в окружении). Manual grep по простым паттернам — без находок. **Рекомендация: отдельный issue для Вики на gitleaks-scan production-ready инструментом**.
- **`.env.example`** — синхронизирован, без real values.
- **`LICENSE`** Proprietary — не публикуем secrets как часть npm package.
- **AES-256-GCM column-level encryption** для PII (firstName/phone/passport) — реализовано в `CryptoService` (#139).
- **Argon2id для passwords + recovery codes**, JWT с refresh-rotation, suspicious-login detector — реализовано (M5.B).
- **Append-only audit log** через Postgres triggers — #218.
- **Rate-limit profiles** (auth/api/sos/media-upload) — #221.
- **Privacy-by-default в outbox events** — `comm.push.subscribed` без endpoint/keys, `feedback.received` без body, и т.д.

**Уязвимости в зависимостях:** не сканировано в этой сессии. Dependabot отсутствует — отдельный gap.

## План работ (приоритеты)

### P0 (блокеры безопасности)
- ✅ нет открытых P0-блокеров

### P1 (базовая структура и документация — ШАГИ 2, 4, 6)
- Создать `STATE.md`, `DECISIONS.md`, `SECURITY.md`
- Создать `docs/ai/` (CLAUDE_CODE_RULES, VIKA_RULES, DEVOPS_RULES, EXTERNAL_TASKS, AUTOMATION)
- Дополнить ISSUE_TEMPLATE: epic, task, tech_debt, vika_devops
- Скопировать `scripts/automation/*` + `lib/*` из kit

### P2 (CI/CD + автоматизация — ШАГИ 7-8)
- Workflows: `auto-labels`, `sub-issue-rollup`, `epic-board-sync`, `dependency-resolver`, `validate-issue`, `weekly-digest`, `stale-cleanup`, `notifications`
- `.github/dependabot.yml`, `labeler.yml`
- `CHANGELOG.md` через release-please (workflow + первая ручная versioning)
- `ROADMAP.md` + `BACKLOG.md` (root) — фасад с ссылками на `docs/TZ/MVP_PHASE3.md` и `docs/BACKLOG/M5/`

### P3 (улучшения качества — ШАГИ 9-10)
- `tools/dashboard/` (опционально)
- `.gitattributes`, `docs/GLOSSARY.md`, `docs/prompts/`
- gitleaks-scan через issue для Вики
- Финал: `docs/STRUCTURE.md` (autogen tree), `_archive/` директория

### Skip / зафиксировать пропуск
- `deploy-staging.yml` / `deploy-prod.yml` — нет staging/prod окружений (только dev на 2.56.241.126). Отметить в `AUDIT.md` ✓.
- `e2e.yml` — Playwright e2e tests не написаны (TODO в #137). Создать workflow shell, активировать когда тесты появятся.
- `release-please.yml` — пока monorepo internal-only (Proprietary), version-bump через дату коммитов. Добавить когда понадобится формальный SemVer.

## Открытые вопросы для founders

| Вопрос | Default (если нет ответа) |
|---|---|
| **Лицензия** | ✅ Proprietary (зафиксирована, ничего не делаю) |
| **Стратегия веток** | ✅ feature-branch + squash-merge (видно из практики, фиксирую в `DECISIONS.md`) |
| **Запретные зоны** | `docs/LEGAL/` + `prisma/migrations/` (не редактировать без issue) — фиксирую в `CLAUDE.md` или `docs/ai/CLAUDE_CODE_RULES.md` |
| **Telegram chat_id для уведомлений** | используем существующий `TELEGRAM_LEADS_CHAT_ID` env (см. `.env.example`); если нужен отдельный для CI/digest — отдельный issue |
| **URL staging/prod** | dev: `2.56.241.126:3010` (web) + `:3011` (api). Staging/prod пока не существуют — отдельный issue когда понадобится |
| **Project Token rotation** | существующий `PROJECT_TOKEN` сломан (failing checks). Issue для Вики |
| **GitHub Pages для дашборда** | tools/dashboard ещё не создан, разворачиваем после ШАГА 9 |

## Связанные документы

- `REPO_SETUP_PROMPT.md` (этот промпт, переезжает в `docs/REPO_SETUP_PROMPT.md`)
- `docs/TZ/MVP_PHASE3.md` (текущий roadmap фазы 3)
- `docs/ARCH/MICROSERVICES.md` (карта сервисов)
- `CLAUDE.md` (принципы разработки)
- `CONTRIBUTING.md` (PR-чеклист)
