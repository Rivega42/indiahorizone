# 🎯 Единый промпт настройки репозитория

Ты — технический архитектор и DevOps-инженер. Настрой этот репозиторий по шагам ниже.
После каждого шага — коммит и обновление `STATE.md`.
Если шаг требует серверных действий или GitHub admin-прав, которых у тебя нет — создай issue для DevOps-агента (Вики) с готовыми командами и переходи дальше.

## 📦 Используемые артефакты комплекта

Все упомянутые ниже файлы лежат в корне репозитория (положены вместе с этим промптом). Не переписывай их с нуля — используй как есть, копируй на нужные места.

| Файл | Назначение | Куда копировать |
|---|---|---|
| `REPO_SETUP_PROMPT.md` | этот файл | остаётся в корне как `docs/REPO_SETUP_PROMPT.md` |
| `scripts/setup-labels.sh` | создание лейблов GitHub | в `scripts/` |
| `scripts/setup-project.sh` | создание Project v2 + полей | в `scripts/` |
| `scripts/dashboard-fetch.mjs` | сбор данных для дашборда | в `scripts/` |
| `scripts/automation/auto-labels.mjs` | синк лейблов и Project статусов | в `scripts/automation/` |
| `scripts/automation/rollup.mjs` | каскадный прогресс эпиков | в `scripts/automation/` |
| `scripts/automation/epic-sync.mjs` | синхронизация эпиков | в `scripts/automation/` |
| `scripts/automation/deps.mjs` | резолв зависимостей | в `scripts/automation/` |
| `scripts/automation/validate.mjs` | валидация issues | в `scripts/automation/` |
| `scripts/automation/digest.mjs` | еженедельный отчёт | в `scripts/automation/` |
| `scripts/automation/notify.mjs` | Telegram уведомления | в `scripts/automation/` |
| `scripts/automation/lib/graphql.mjs` | общие GraphQL-запросы | в `scripts/automation/lib/` |
| `scripts/automation/lib/parse.mjs` | парсинг body issues | в `scripts/automation/lib/` |
| `.github/workflows/*.yml` | 11 готовых workflow-ов | в `.github/workflows/` |
| `.github/ISSUE_TEMPLATE/*.yml` | YAML-формы для issues | в `.github/ISSUE_TEMPLATE/` |
| `.github/PULL_REQUEST_TEMPLATE.md` | шаблон PR | в `.github/` |
| `docs/ai/AUTOMATION.md` | документация автоматизации | в `docs/ai/` |

## 🌐 Базовые принципы

- **Язык артефактов:** русский. Технические термины (API, webhook, runbook, CI/CD) — на английском.
- **Имена веток, файлов кода, идентификаторов:** только латиница, kebab-case для веток и файлов, иначе — каноничный для языка стиль.
- **Документ и код — в одном PR.** Любая фича, меняющая поведение, обновляет документацию.
- **Иерархия issues:** epic → issue → sub-issue. Одиночные issues без родителя — антипаттерн.
- **Серверные действия — через issue с тегом `[devops:vika]`.** Не делай их сам.
- **Не удаляй ничего без подтверждения.** Перемещай в `_archive/YYYY-MM-DD/`.
- **Работа поэтапная.** Один шаг = один коммит = одно обновление `STATE.md`.
- **Ветка работы:** `chore/repo-setup`. В конце — один большой PR в main с описанием по шагам.
- **Если шаг неприменим** (нет БД → пропустить prisma-check) — зафиксируй пропуск в `AUDIT.md`.
- **Если упираешься в неоднозначность** (выбор лицензии, стратегия веток) — создай issue `статус: нужна инфа`, продолжай.
- **При обнаружении секретов в git history** — НЕМЕДЛЕННО останови работу, создай P0 issue для Вики с алертом.

## 📋 Формат issue для Вики

```markdown
Title: [devops:vika] <короткое описание>

## Цель
Что должно произойти и зачем.

## Окружение
dev / staging / prod / github-org / github-repo

## Приоритет
P0 / P1 / P2 / P3

## Команды (пошагово)
\`\`\`bash
команда 1
команда 2
\`\`\`

## Verification
Как проверить, что применилось.

## Acceptance criteria
- [ ] критерий 1
- [ ] критерий 2

## Связанные документы
Ссылки на ROADMAP, DECISIONS, другие issues.
```

---

# ШАГ 1: Инвентаризация и план

## 1.1 Сканирование репо
Определи: стек, тип проекта, стадию, точки входа, внешние интеграции, состояние документации/тестов/CI, существующие конвенции.

## 1.2 Поиск проблем
- Битые ссылки в `.md` (`markdown-link-check`)
- Устаревшие зависимости (CVE — отдельно с P0)
- Мёртвый код, дубликаты
- TODO/FIXME без автора и даты
- Секреты в истории: `gitleaks detect --source . --log-opts="--all"`

## 1.3 Создай `AUDIT.md`

```markdown
# Аудит репозитория

**Дата:** YYYY-MM-DD
**Аудитор:** Claude Code

## Контекст
- Стек: ...
- Тип: ...
- Стадия: ...
- Размер: N файлов / M строк

## Сильные стороны (сохранить)
## Существующие конвенции (уважать, не переписывать)
## Что сломано
## Что отсутствует
## Технический долг
## Безопасность
- Секреты в истории: НЕТ / ДА (если ДА → P0 issue для Вики)
- Уязвимости в зависимостях

## План работ
- P0: блокеры безопасности
- P1: базовая структура и документация
- P2: CI/CD, автоматизация
- P3: улучшения качества

## Открытые вопросы для founders
- Лицензия?
- Стратегия веток?
- Список запретных зон?
- Telegram канал для уведомлений (chat_id)?
- URL staging/prod?
```

## 1.4 Коммит
`chore(audit): шаг 1 — инвентаризация`

---

# ШАГ 2: Базовая документация (корень)

Создай отсутствующее. Существующее — уважай.

Файлы: `README.md`, `CLAUDE.md`, `STATE.md`, `DECISIONS.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `ROADMAP.md`, `BACKLOG.md`, `LICENSE` (если нет — issue для founders), `SECURITY.md`, `.editorconfig`, `.gitattributes`, `.gitignore`, `.env.example`.

## Шаблоны (ключевые)

### `STATE.md`
```markdown
# Состояние проекта

**Дата обновления:** YYYY-MM-DD
**Версия:** vX.Y.Z
**Стадия:** ...

## В работе сейчас
## Заблокировано
## Известные проблемы
## Следующие шаги (по роадмапу)
```

### `ROADMAP.md`
```markdown
# Роадмап

> Источник правды: GitHub Milestones + Project + этот файл
> Дашборд: <URL после ШАГА 9>

## Видение
## Quarterly Roadmap
### Текущий квартал — <цель>
### Следующий квартал
### Long-term
## Эпики и зависимости (Mermaid)
## Метрики успеха
## Связанные документы
```

### `BACKLOG.md`
```markdown
# Бэклог

> Источник правды: GitHub Issues с лейблом `статус: бэклог`
> Дашборд: <URL после ШАГА 9>

## Сейчас в спринте
## Up Next
## Discovery
## Idea Pool
## Заблокировано
```

### `CLAUDE.md`
- Архитектура в одном экране
- Команды (run/build/test/lint/migrate/deploy)
- Карта директорий
- Запретные зоны
- Правило: читать `STATE.md` перед сессией и обновлять после
- Ссылки на ROADMAP, BACKLOG, DECISIONS, `docs/ai/AUTOMATION.md`
- Формат issue для Вики (см. выше)

## Коммит
`chore(docs): шаг 2 — базовая документация`

---

# ШАГ 3: Структура директорий

```
<root>/
├── <код>/
├── tests/
├── docs/
│   ├── adr/
│   ├── architecture/
│   ├── api/
│   ├── runbooks/
│   ├── guides/
│   ├── ai/              # правила для AI-исполнителей
│   ├── prompts/         # системные промпты как код
│   ├── context/         # бизнес-контекст для AI
│   ├── GLOSSARY.md
│   └── README.md
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── workflows/
│   ├── CODEOWNERS
│   └── dependabot.yml
├── infra/
├── scripts/
│   └── automation/
│       └── lib/
├── tools/dashboard/
└── _archive/
```

Существующее — сохранить. `docs/README.md` — карта документации.

Коммит: `chore(structure): шаг 3 — структура директорий`

---

# ШАГ 4: Правила для AI-исполнителей

Создай `docs/ai/`:
- `CLAUDE_CODE_RULES.md`
- `CLAUDE_DESIGN_RULES.md`
- `VIKA_RULES.md`
- `DEVOPS_RULES.md`
- `EXTERNAL_TASKS.md`
- `AUTOMATION.md` — **скопируй из комплекта** (`docs/ai/AUTOMATION.md`)

Коммит: `chore(docs): шаг 4 — правила для AI`

---

# ШАГ 5: Контекст для AI

Создай `docs/context/PRODUCT_CONTEXT.md`, `docs/context/DOMAIN.md`, `docs/GLOSSARY.md`, `docs/prompts/`.

Коммит: `chore(docs): шаг 5 — контекст и глоссарий`

---

# ШАГ 6: GitHub Labels, Issue Templates, PR Template

## 6.1 Лейблы
**Скопируй `scripts/setup-labels.sh` из комплекта в `scripts/setup-labels.sh`.**

Запуск:
```bash
bash scripts/setup-labels.sh
```

Если нет прав GitHub admin — создай issue:
```markdown
[devops:vika] Применить лейблы из scripts/setup-labels.sh
## Команды
bash scripts/setup-labels.sh
## Acceptance
- [ ] Все лейблы созданы (gh label list | wc -l >= 30)
```

## 6.2 Шаблоны issues
**Скопируй из комплекта в `.github/ISSUE_TEMPLATE/`:**
- `bug_report.yml`
- `feature_request.yml`
- `task.yml`
- `tech_debt.yml`
- `epic.yml`
- `vika_devops.yml`

В каждом замени плейсхолдер `EPIC-1, EPIC-2, EPIC-3` на реальные эпики проекта (после создания их в ШАГЕ 8).

## 6.3 PR Template
**Скопируй `.github/PULL_REQUEST_TEMPLATE.md` из комплекта.**

## 6.4 Коммит
`chore(github): шаг 6 — лейблы, шаблоны issues и PR`

---

# ШАГ 7: CI/CD пайплайны

## 7.1 Скопируй workflow-ы из комплекта в `.github/workflows/`

**Базовый CI/CD:**
- `ci-pr.yml` — проверки на PR (lint, type-check, tests, build, gitleaks, CodeQL)
- `deploy-staging.yml` — auto-deploy в staging
- `deploy-prod.yml` — manual approval + tag-based prod deploy
- `e2e.yml` — ночные E2E на staging
- `release-please.yml` — авто-CHANGELOG и релизные PR
- `labeler.yml` — авто-лейблы по путям файлов и размеру PR

**Адаптируй под стек:** замени build/test команды на актуальные для проекта (npm/pnpm/poetry/cargo/go).

## 7.2 Dependabot
Скопируй `.github/dependabot.yml` (или создай по шаблону внутри workflow комплекта).

## 7.3 Pre-commit hooks
Создай `.pre-commit-config.yaml` или установи Husky:
- lint-staged
- commitlint (Conventional Commits)
- gitleaks
- prevent commit to protected branches

## 7.4 GitHub Environments — issue для Вики

```markdown
[devops:vika] Настроить GitHub Environments

## Цель
Создать staging (auto-deploy) и production (manual approval).

## Окружение
github-repo

## Команды
\`\`\`bash
gh api repos/:owner/:repo/environments/staging -X PUT -f wait_timer=0

gh api repos/:owner/:repo/environments/production \
  -X PUT \
  -f wait_timer=300 \
  -F prevent_self_review=true \
  -f "reviewers[][type]=User" \
  -f "reviewers[][id]=<FOUNDER_USER_ID>" \
  -f "deployment_branch_policy[protected_branches]=false" \
  -f "deployment_branch_policy[custom_branch_policies]=true"

gh api repos/:owner/:repo/environments/production/deployment-branch-policies \
  -X POST -f name="v*"
\`\`\`

## Acceptance
- [ ] staging без approval
- [ ] production требует approval founders
- [ ] production деплоится только с tag v*
```

## 7.5 Коммит
`chore(ci): шаг 7 — CI/CD пайплайны`

---

# ШАГ 8: Автоматизация состояний (issues, sub-issues, Project)

## 8.1 GitHub Project v2 — issue для Вики

**Скопируй `scripts/setup-project.sh` из комплекта в `scripts/setup-project.sh`.**

```markdown
[devops:vika] Создать GitHub Project v2 с кастомными полями

## Цель
Единый Project board как источник правды о состоянии задач.

## Команды
\`\`\`bash
bash scripts/setup-project.sh "<OWNER>" "<REPO>"
\`\`\`

## Verification
- В Project видно 12 кастомных полей
- Native workflows включены

## Acceptance
- [ ] Project "Roadmap" создан
- [ ] Поля: Status, Priority, Size, Sprint, Batch, Epic, Stream, Start date, Target date, Progress, Blocked by, Component
- [ ] Native workflow `Auto-add to project` включён
- [ ] Native workflow `Item closed → Status: Готово` включён
- [ ] Native workflow `PR merged → linked issue: Готово` включён
- [ ] Native workflow `Auto-archive items` (>14 дней) включён
- [ ] Project URL добавлен в README первой строкой
- [ ] PROJECT_NUMBER записан в GitHub Secrets как `PROJECT_NUMBER`
- [ ] PAT с правами `repo + project + read:org` создан и записан в `PROJECT_TOKEN`
```

## 8.2 Workflow-ы автоматизации
**Скопируй из комплекта в `.github/workflows/`:**
- `auto-labels.yml`
- `sub-issue-rollup.yml`
- `epic-board-sync.yml`
- `dependency-resolver.yml`
- `validate-issue.yml`
- `weekly-digest.yml`
- `stale-cleanup.yml`
- `notifications.yml`

## 8.3 Скрипты автоматизации
**Скопируй из комплекта в `scripts/automation/`:**
- `auto-labels.mjs`
- `rollup.mjs`
- `epic-sync.mjs`
- `deps.mjs`
- `validate.mjs`
- `digest.mjs`
- `notify.mjs`
- `lib/graphql.mjs`
- `lib/parse.mjs`

Это ESM-модули, работают через `actions/github-script@v7` с динамическим импортом.

## 8.4 Branch protection — issue для Вики

```markdown
[devops:vika] Настроить branch protection для main

## Команды
\`\`\`bash
gh api repos/:owner/:repo/branches/main/protection \
  -X PUT --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "ci-pr / lint",
      "ci-pr / type-check",
      "ci-pr / test",
      "ci-pr / build",
      "gitleaks",
      "validate-issue"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "required_approving_review_count": 1,
    "require_code_owner_reviews": true
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
EOF
\`\`\`
```

## 8.5 Коммит
`chore(automation): шаг 8 — автоматизация состояний`

---

# ШАГ 9: Дашборд

## 9.1 Структура `tools/dashboard/`
React + Vite + Tailwind. Views: RoadmapView, BacklogView, BoardView, EpicsView, DependencyView.

## 9.2 Источник данных
**Скопируй `scripts/dashboard-fetch.mjs` из комплекта в `scripts/dashboard-fetch.mjs`.**

Скрипт через GitHub GraphQL собирает: issues, Project items, кастомные поля, sub-issues, PR'ы. Сохраняет в `tools/dashboard/data/snapshot.json`.

## 9.3 Workflow синхронизации
Скопируй `.github/workflows/dashboard-sync.yml` из комплекта.

## 9.4 GitHub Pages — issue для Вики

```markdown
[devops:vika] Включить GitHub Pages для дашборда

## Команды
\`\`\`bash
gh api repos/:owner/:repo/pages \
  -X POST \
  -f source[branch]=gh-pages \
  -f source[path]=/
\`\`\`

## Acceptance
- [ ] GitHub Pages активирован
- [ ] URL: https://<owner>.github.io/<repo>/ доступен
- [ ] URL добавлен в README, ROADMAP, BACKLOG первой строкой
```

## 9.5 Коммит
`chore(dashboard): шаг 9 — интерактивный дашборд`

---

# ШАГ 10: Безопасность и финал

## 10.1 Безопасность
- gitleaks на всю историю (если найдено → P0 issue для Вики на ротацию + BFG)
- `.env.example` со всеми переменными
- `SECURITY.md` создан
- `.github/CODEOWNERS` написан
- Issue для Вики на включение Security Features:

```markdown
[devops:vika] Включить GitHub Security Features

## Команды
\`\`\`bash
gh api repos/:owner/:repo/vulnerability-alerts -X PUT
gh api repos/:owner/:repo/automated-security-fixes -X PUT
\`\`\`

## Acceptance
- [ ] Dependabot alerts включён
- [ ] Secret scanning включён
- [ ] Code scanning (CodeQL) включён
- [ ] Private vulnerability reporting включён
```

## 10.2 Финальная проверка
- Все CI workflows проходят (push в feature-ветку для проверки)
- markdown lint + link check
- `docs/STRUCTURE.md` сгенерирован (`tree`)
- `STATE.md` обновлён итогом
- `AUDIT.md` обновлён со статусом каждого пункта (✅/⏸/⏭/🔄)

## 10.3 Финальные issues
- `[META] Финальный обход после аудита` — чек-лист для founders
- `[META] Назначить лицензию` (если не было)
- `[META] DevOps настройки от Вики` — сводка всех `[devops:vika]` issues

## 10.4 PR
Большой PR в main с описанием по шагам.

## 10.5 Коммит
`chore(audit): шаг 10 — безопасность и финал`

---

# 📌 Резюме

**Сам в коде:** ШАГИ 1-7, 8.2-8.3, 9.1-9.3, 10.1-10.4
**Issues для Вики:** 7.4, 8.1, 8.4, 9.4, 10.1 + ротации ключей
**Issues для founders (`статус: нужна инфа`):** лицензия, стратегия веток, запретные зоны, Telegram chat_id, URL окружений, члены команды

# ⚠️ Адаптация под проект
1. Сверяйся с реальным состоянием на ШАГЕ 1
2. Существующие конвенции — уважай
3. Команды/конфиги — адаптируй под стек
4. Неприменимые шаги — пропусти, зафиксируй в `AUDIT.md`
5. Расширяй по необходимости

ПОЕХАЛИ. Старт — ШАГ 1, создание `AUDIT.md`.
