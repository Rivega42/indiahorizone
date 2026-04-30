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

## План работ (приоритеты) — итоги после ШАГОВ 1-10

| Пункт | Статус |
|---|---|
| **P0 блокеры безопасности** | ✅ нет открытых |
| `STATE.md` | ✅ создан |
| `DECISIONS.md` | ✅ создан (10 ADR) |
| `SECURITY.md` | ✅ создан |
| `CHANGELOG.md` | ✅ создан + release-please workflow для будущей автогенерации |
| `ROADMAP.md` (root) | ✅ создан (фасад) |
| `BACKLOG.md` (root) | ✅ создан (фасад) |
| `.gitattributes` | ✅ создан (LF normalization) |
| `docs/ai/` | ✅ создан (CLAUDE_CODE_RULES, VIKA_RULES, DEVOPS_RULES, CLAUDE_DESIGN_RULES, EXTERNAL_TASKS, AUTOMATION) |
| `docs/context/` | ✅ создан (PRODUCT_CONTEXT, DOMAIN) |
| `docs/GLOSSARY.md` | ✅ создан |
| `docs/prompts/` | ✅ создан (placeholder директория) |
| `docs/adr/` | ✅ создана (использовать для длинных ADR; короткие — в `DECISIONS.md`) |
| `docs/STRUCTURE.md` | ✅ создан (autogen) |
| `docs/REPO_SETUP_PROMPT.md` | ✅ копия от kit'а |
| `docs/repo-setup-vika-tasks.md` | ✅ список задач для Vика после merge'а |
| `scripts/setup-labels.sh` + `setup-project.sh` | ✅ скопированы (Vика запустит) |
| `scripts/dashboard-fetch.mjs` | ✅ скопирован |
| `scripts/automation/*` (auto-labels, rollup, epic-sync, deps, validate, digest, notify + lib/) | ✅ скопированы |
| 4 новых ISSUE_TEMPLATE (epic, task, tech_debt, vika_devops) | ✅ скопированы (3 существующих — bug/feature/config — сохранены) |
| `.github/dependabot.yml` | ✅ создан (npm + docker + actions, без pip) |
| `.github/labeler.yml` | ✅ скопирован |
| `.github/markdown-link-check.json` | ✅ скопирован |
| **11 новых workflows** (auto-labels, sub-issue-rollup, epic-board-sync, dependency-resolver, validate-issue, weekly-digest, stale-cleanup, notifications, dashboard-sync, release-please, path-size-labeler) | ✅ все скопированы |
| `tools/dashboard/` | 🟡 placeholder README создан, React-app — отдельным PR |
| `_archive/` директория | ✅ создана + zip перемещён в `_archive/2026-04-29/` |
| **PR template** | ⏭ existing сохранён (уважаем) |
| `ci.yml` workflow | ⏭ existing сохранён (уважаем; не дублируем kit'овый ci-pr.yml) |
| `prisma-check.yml` workflow | ⏭ existing сохранён |
| `lighthouse.yml` workflow | ⏭ existing сохранён (создан в #384) |
| `deploy-dev.yml` workflow | ⏭ existing сохранён |
| `deploy-staging.yml` / `deploy-prod.yml` | ⏭ skip — нет окружений |
| `e2e.yml` | ⏭ skip — нет Playwright тестов (TODO #137) |
| **Branch protection** для main | 🔄 issue для Вики (см. `docs/repo-setup-vika-tasks.md`) |
| **GitHub Project v2 + кастомные поля** | 🔄 issue для Вики (Project уже есть, проверить fields) |
| **PROJECT_TOKEN rotation** | 🔄 issue для Вики (текущий expired) |
| **Применить лейблы** | 🔄 issue для Вики (`bash scripts/setup-labels.sh`) |
| **GitHub Security Features** (Dependabot alerts, Secret scanning, CodeQL) | 🔄 issue для Вики |
| **gitleaks scan** на git history | 🔄 issue для Вики (нет binary в окружении Claude) |
| **GitHub Pages для dashboard** | 🔄 отложено до создания React-app в `tools/dashboard/` |
| **Telegram secrets** для weekly-digest + notifications | 🔄 issue для Вики (опционально) |

### Легенда
- ✅ выполнено в `chore/repo-setup` PR
- 🟡 placeholder (отдельный PR в будущем)
- 🔄 issue для Vика после merge
- ⏭ skip / неприменимо (зафиксировано)

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
