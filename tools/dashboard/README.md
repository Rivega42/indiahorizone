# Dashboard (placeholder)

> **Статус:** placeholder. Workflow'ы (`dashboard-sync.yml`) + fetcher (`scripts/dashboard-fetch.mjs`) развёрнуты в `chore/repo-setup` PR. Сам React-фронт dashboard'а — отдельный PR в будущем.

## Что планируется

Web-app для визуализации roadmap / backlog / эпиков / зависимостей из GitHub Project v2.

**Stack:** React 18 + Vite + Tailwind + shadcn/ui (тот же стек что `apps/web`).

**Views:**
- **Roadmap** — quarterly planning с эпиками + ключевыми milestones
- **Backlog** — приоритизированный список тикетов
- **Board** — kanban-style по Status (Todo / In Progress / Review / Done)
- **Epics** — иерархия с прогресс-барами (rollup от sub-issues)
- **Dependencies** — граф зависимостей (Mermaid или D3)

## Как работает (когда будет реализован)

```
GitHub Project v2 + Issues (источник правды)
    ↓ (раз в час)
.github/workflows/dashboard-sync.yml → scripts/dashboard-fetch.mjs
    ↓
tools/dashboard/data/snapshot.json
    ↓
tools/dashboard/ React app (build + deploy)
    ↓
GitHub Pages (https://rivega42.github.io/indiahorizone/)
```

## Создание (TODO в новом issue)

```bash
cd tools/dashboard
npm create vite@latest . -- --template react-ts
pnpm add -D tailwindcss postcss autoprefixer
# скопировать дизайн-токены из apps/web/app/globals.css
# создать src/views/{Roadmap,Backlog,Board,Epics,Dependencies}.tsx
# `pnpm build` → `dist/` копируется в `gh-pages` ветку через workflow
```

## Связанные

- `scripts/dashboard-fetch.mjs` — fetcher (GraphQL, в `chore/repo-setup`)
- `.github/workflows/dashboard-sync.yml` — workflow (cron + manual)
- Issue для Вики `[devops:vika] Включить GitHub Pages для dashboard` — после первого build'а
- `docs/ai/AUTOMATION.md` § dashboard
