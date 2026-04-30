# Задачи для Вики после merge `chore/repo-setup`

> Этот документ — список issues которые надо создать в GitHub после merge'а PR `chore/repo-setup`. Каждый — отдельный issue с тегом `[devops:vika]`.

## 1. `[devops:vika] Применить лейблы из scripts/setup-labels.sh`

**Цель:** создать 30+ лейблов в репозитории через готовый скрипт.

**Окружение:** github-repo Rivega42/indiahorizone

**Команды:**
```bash
bash scripts/setup-labels.sh
```

**Verification:** `gh label list | wc -l` ≥ 30

**Acceptance:**
- [ ] Все лейблы созданы
- [ ] Существующие (P0/P1/P2/shivam/design/...) сохранены — проверить duplicates по имени

## 2. `[devops:vika] Создать GitHub Project v2 + кастомные поля (или адаптировать существующий)`

**Цель:** GitHub Project (https://github.com/users/Rivega42/projects/3) уже существует. Проверить что у него есть нужные kit-поля или добавить недостающие.

**Окружение:** github user-projects Rivega42

**Поля которые должны быть** (из `setup-project.sh`):
- Status (single-select)
- Priority (P0/P1/P2/P3)
- Size (XS/S/M/L/XL)
- Sprint (iteration)
- Batch (iteration)
- Epic (text)
- Stream (Платформа/Продукт/Инфра/AI/Команда)
- Start date / Target date
- Progress (number 0-100)
- Blocked by (text)
- Component (single-select по labeler.yml)

**Команды:**
```bash
# Если хотим создать с нуля:
bash scripts/setup-project.sh "Rivega42" "indiahorizone"
# ИЛИ адаптировать существующий — через GitHub UI или GraphQL.
```

**Verification:** Project открывается, видно все поля.

**Acceptance:**
- [ ] Все 12 полей присутствуют (или эквиваленты)
- [ ] Native workflow `Auto-add to project` включён
- [ ] Native workflow `Item closed → Status: Готово` включён
- [ ] Native workflow `PR merged → linked issue: Готово` включён
- [ ] PROJECT_NUMBER записан в Repo Variables (`gh variable set PROJECT_NUMBER --value <N>`)
- [ ] PROJECT_OWNER записан (опционально, default = `github.repository_owner`)
- [ ] PAT с `repo + project + read:org` создан и записан в Secrets как `PROJECT_TOKEN`
- [ ] **Текущий expired PROJECT_TOKEN** — ротирован. Сейчас он сломан (см. failing checks "PR opened → In Progress" на каждом PR'е).

## 3. `[devops:vika] Включить branch protection для main`

**Цель:** запретить force-push, требовать review + проверки CI до merge.

**Окружение:** github-repo

**Команды:**
```bash
gh api repos/Rivega42/indiahorizone/branches/main/protection \
  -X PUT --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Lint + Format + Type-check + Tests",
      "Schema ↔ Migrations in sync"
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
```

**Verification:** `gh api repos/Rivega42/indiahorizone/branches/main/protection` показывает рабочую конфигурацию.

**Acceptance:**
- [ ] `required_status_checks` активен с обоими checks
- [ ] PR без approval не мерджится (тест: попытка merge без review → блок)
- [ ] Force-push в main → блок
- [ ] Squash-merge включён, merge-commit-метод выключен (для линейной истории)

> **⚠️ Note:** "Schema ↔ Migrations in sync" check работает только на schema-touching PR'ах. Для прочих PR'ов он будет skipped, не блокирующим. Если GitHub помечает skipped как failure — добавить `"Schema ↔ Migrations in sync (optional)"` или убрать из required.

## 4. `[devops:vika] Включить GitHub Security Features`

**Цель:** включить Dependabot, Secret Scanning, CodeQL, Private Vulnerability Reporting.

**Команды:**
```bash
gh api repos/Rivega42/indiahorizone/vulnerability-alerts -X PUT
gh api repos/Rivega42/indiahorizone/automated-security-fixes -X PUT
# Secret scanning + CodeQL — через UI: Settings → Code security and analysis
# Private vulnerability reporting:
gh api repos/Rivega42/indiahorizone/private-vulnerability-reporting -X PUT
```

**Acceptance:**
- [ ] Dependabot alerts включены (видны на /security/dependabot)
- [ ] Automated security fixes включены (auto-PR'ы при CVE)
- [ ] Secret scanning + Push protection включены
- [ ] CodeQL включён (auto-настроен GitHub'ом для JavaScript/TypeScript)
- [ ] Private vulnerability reporting включено (для security@indiahorizone.ru)

## 5. `[devops:vika] Запустить gitleaks scan на всю историю`

**Цель:** проверить git history на закомиченные секреты (нет gitleaks binary в окружении Claude Code).

**Команды:**
```bash
# Установить gitleaks
brew install gitleaks  # или apt / docker run zricethezav/gitleaks

# Полный scan
gitleaks detect --source /home/user/indiahorizone --log-opts="--all" --report-path /tmp/gitleaks-report.json
```

**Verification:** report.json пустой (no leaks) или конкретные находки.

**Acceptance:**
- [ ] Scan выполнен на всех 177+ коммитах истории
- [ ] При находках — P0 issue для founders на ротацию + BFG clean-up
- [ ] При чистоте — добавить `gitleaks` в CI workflow (новый workflow `gitleaks.yml` через `gitleaks/gitleaks-action@v2`)

## 6. `[devops:vika] Включить GitHub Pages для будущего dashboard`

**Цель:** Когда добавим `tools/dashboard/` (ШАГ 9 не сделан в текущем PR), GitHub Pages должен быть включён.

**Команды:**
```bash
# После создания tools/dashboard/ + workflow dashboard-sync.yml
gh api repos/Rivega42/indiahorizone/pages \
  -X POST \
  -f source[branch]=gh-pages \
  -f source[path]=/
```

**Verification:** https://rivega42.github.io/indiahorizone/ открывается.

**Acceptance:**
- [ ] GitHub Pages активирован
- [ ] URL добавлен в `README.md`, `ROADMAP.md`, `BACKLOG.md` первой строкой

> **Note:** Если `tools/dashboard/` ещё не создан — этот issue парк'ован до тех пор. Можно закрыть как `not_planned` и пересоздать когда понадобится.

## 7. `[devops:vika] (опционально) Telegram chat_id для weekly digest + notifications`

**Цель:** workflow'ы `weekly-digest.yml` + `notifications.yml` (kit) шлют уведомления в Telegram. Нужен `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` секреты.

**Команды:**
```bash
# Создать бота через @BotFather → получить TOKEN
# Получить chat_id — пригласить @userinfobot в чат, он покажет ID

gh secret set TELEGRAM_BOT_TOKEN --body "<token>"
gh secret set TELEGRAM_CHAT_ID --body "<chat_id>"
```

**Acceptance:**
- [ ] Secrets установлены
- [ ] `notifications.yml` workflow запускается на P0/P1 issue events и шлёт в Telegram
- [ ] `weekly-digest.yml` шлёт еженедельный отчёт по понедельникам

> Если решено что digest не нужен в phase 3 — закрыть workflow'ы (commented-out triggers) или удалить. Issue может быть закрыт `not_planned`.

## Связанные документы

- `chore/repo-setup` PR (этот) — описание всех изменений
- `AUDIT.md` — инвентаризация репо до настройки
- `docs/ai/AUTOMATION.md` — описание автоматизации
- `docs/ai/VIKA_RULES.md` — правила работы Вики
