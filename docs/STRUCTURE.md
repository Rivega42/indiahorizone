# Структура репозитория

> Auto-generated. Регенерируется через `find . -type d -not -path '*/node_modules/*' ...`. Не редактировать вручную (изменения перекроются при следующей регенерации).

```
indiahorizone/
├── apps/
│   ├── api/          # NestJS backend (M5 — auth/clients/trips/comm/feedback/audit/push)
│   │   ├── prisma/
│   │   │   ├── migrations/  # versioned SQL migrations
│   │   │   └── seed/        # tour catalog seed JSONs
│   │   └── src/
│   │       ├── common/      # crypto, prisma, redis, throttle, events-bus, outbox, tracing
│   │       └── modules/     # auth, clients, trips, comm, feedback, audit, catalog, media, health
│   ├── mobile/       # React Native (placeholder phase 4)
│   └── web/          # Next.js 14 frontend
│       ├── app/
│       │   ├── (auth)/      # /login, /register
│       │   ├── (legal)/     # /privacy, /consent, /offer
│       │   ├── profile/     # /profile, /profile/notifications
│       │   └── tours/       # /tours, /tours/[slug]
│       ├── components/
│       │   ├── push/        # EnableNotificationsButton, IosInstallInstructions
│       │   ├── tour/        # Hero, Facts, DayTimeline, ... — extracted в #377
│       │   └── ui/          # shadcn-style primitives
│       └── lib/
│           ├── api/         # tours, leads, preferences, push-subscriptions, client
│           ├── auth/        # store, hooks, api
│           ├── legal/       # versions
│           ├── mock/        # fallback Tour data
│           ├── push/        # use-push-support, subscribe
│           └── seo/         # tour-jsonld
├── packages/
│   ├── shared/       # shared TS types/utils между api+web (CommonJS output)
│   └── ui/           # shared UI primitives (TBD активировать когда понадобятся)
├── docs/
│   ├── ARCH/         # архитектура (EVENTS, MICROSERVICES, OFFLINE, CATALOG, SECURITY)
│   ├── adr/          # Architecture Decision Records (см. также DECISIONS.md в корне)
│   ├── ai/           # правила для AI-исполнителей (Claude Code, Vика, Claude Design, DevOps, External)
│   ├── archive/      # архивные документы (старые версии ТЗ и т.п.)
│   ├── BACKLOG/M5/   # детальный backend backlog по slice'ам
│   ├── BUSINESS_MODEL/  # бизнес-модель + unit economics
│   ├── context/      # PRODUCT_CONTEXT, DOMAIN — для AI pre-read
│   ├── FINANCE/      # финансы + платежи
│   ├── LEGAL/        # юридические документы
│   │   ├── CONSENTS/ # granular consent типы
│   │   └── CONTRACTS/  # шаблоны договоров
│   ├── LOYALTY/      # программа лояльности
│   ├── OPS/          # operations (гид-онбординг, чеклисты)
│   ├── prompts/      # системные промпты как код (placeholder)
│   ├── SOS/          # SOS-документация
│   │   └── PLAYBOOKS/  # 6 типов инцидентов (placeholder, P0 #279)
│   ├── TZ/           # ТЗ (главное — MVP_PHASE3.md)
│   ├── UX/           # UX-документы, design system
│   │   ├── FEATURES/ # детали по фичам
│   │   └── prototypes/  # Claude Design HTML прототипы
│   ├── wiki/         # GitHub wiki mirror (если есть)
│   ├── GLOSSARY.md   # доменные термины
│   ├── REPO_SETUP_PROMPT.md  # копия промпта по настройке (origin chore/repo-setup)
│   ├── STRUCTURE.md  # этот файл (auto-generated)
│   └── repo-setup-vika-tasks.md  # Vика-задачи после merge chore/repo-setup
├── scripts/
│   ├── automation/   # ESM-скрипты для GitHub Actions (auto-labels, rollup, epic-sync, deps, validate, digest, notify)
│   │   └── lib/      # graphql.mjs, parse.mjs (общие helpers)
│   ├── dashboard-fetch.mjs  # GraphQL → snapshot.json для dashboard
│   ├── setup-labels.sh   # bulk-create labels
│   └── setup-project.sh  # bulk-create Project v2 + fields
├── tools/
│   └── dashboard/    # GitHub Pages dashboard (placeholder, реализуется отдельным PR)
├── deploy/           # docker-compose dev override + deployment configs
├── _archive/         # архивные файлы (move-here вместо delete)
├── .github/
│   ├── ISSUE_TEMPLATE/  # bug, feature, config, epic, task, tech_debt, vika_devops
│   ├── workflows/    # 17 workflow'ов: ci, prisma-check, lighthouse, deploy-dev, auto-label, project-automation, path-size-labeler, release-please, auto-labels, sub-issue-rollup, epic-board-sync, dependency-resolver, validate-issue, weekly-digest, stale-cleanup, notifications, dashboard-sync
│   ├── CODEOWNERS    # ownership map
│   ├── dependabot.yml  # auto-update deps
│   ├── labeler.yml   # path-based label rules
│   ├── markdown-link-check.json
│   ├── pull_request_template.md
│   └── workflows/    # см. выше
├── AUDIT.md          # инвентаризация репо (chore/repo-setup PR)
├── BACKLOG.md        # фасад → docs/BACKLOG/M5/
├── CHANGELOG.md      # версионная история (через release-please)
├── CLAUDE.md         # принципы разработки IndiaHorizone
├── CONTRIBUTING.md   # PR-чеклист
├── DECISIONS.md      # ADR (Architecture Decision Records)
├── docker-compose.yml
├── eslint.config.mjs
├── LICENSE           # Proprietary
├── Makefile
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── README.md
├── ROADMAP.md        # фасад → docs/TZ/MVP_PHASE3.md
├── SECURITY.md       # responsible disclosure
├── STATE.md          # текущее состояние работ (live)
├── tsconfig.base.json
├── tsconfig.json
├── .editorconfig
├── .env.example
├── .gitattributes
├── .gitignore
├── .lighthouserc.json
└── .prettierrc / .prettierignore
```

## Регенерация

```bash
find /home/user/indiahorizone -maxdepth 4 -type d \
  -not -path '*/node_modules/*' \
  -not -path '*/.next/*' \
  -not -path '*/dist/*' \
  -not -path '*/.git/*' \
  | sort
```

## Связанные документы

- `README.md` — high-level overview
- `CLAUDE.md` — принципы разработки + карта зависимостей
- `docs/ai/AUTOMATION.md` — описание GitHub Actions
- `STATE.md` — текущее состояние
