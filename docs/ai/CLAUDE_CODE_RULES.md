# Правила для Claude Code

> Этот файл — обязательный pre-read для каждой сессии Claude Code.
> Дополнение к корневому `CLAUDE.md` (общие принципы), фокус — конкретные процедуры.

## Pre-session checklist (всегда)

1. Прочитать `STATE.md` (текущее состояние).
2. Прочитать тикет / запрос пользователя полностью.
3. Найти связанные issues / PR'ы (`Part of #N`, `Depends on #N`).
4. Просмотреть существующий код в зоне изменений — не изобретать велосипед.
5. Если задача неоднозначна — задать вопрос, не угадывать.

## Workflow

### Ветки

- Имя: `claude/<topic>` (для AI sessions, отличает от ручных feature-веток разработчика).
- Создавать от `main` (свежий `git fetch origin main`).
- Не работать в `main` напрямую.

### Коммиты

- **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `ci:`, `perf:`).
- Один коммит = одно логическое изменение.
- Тело коммита — на русском, с обоснованием **почему**.
- Подпись `https://claude.ai/code/session_*` — необязательна, но если поставлена — оставляем.

### PR

- Заголовок `<scope>: <imperative>` (например, `feat(comm): push backend foundation`).
- Body — markdown по шаблону `.github/pull_request_template.md`.
- Включать: Summary, Что внутри, Recommendation для founders (princip 6 CLAUDE.md), Test plan, Out of scope.
- Добавлять `Closes #N` если есть issue.
- НЕ создавать PR без explicit запроса от user'а — если только не указан autopilot mode.

### Pre-PR checks (всегда)

```bash
pnpm lint           # ESLint
pnpm format:check   # Prettier
pnpm type-check     # tsc -b (workspace projects)
pnpm test           # сейчас TODO-stubs, всё равно прогонять
pnpm --filter @indiahorizone/web build   # если frontend
pnpm --filter @indiahorizone/api build   # если backend
```

Все 4 должны быть зелёными до push'а. CI workflow `Lint + Format + Type-check + Tests` это enforce'ит.

### Schema-touching PR'ы (Prisma)

- Изменение `apps/api/prisma/schema.prisma` → **обязательно** новая миграция в `apps/api/prisma/migrations/`.
- Запустить локально: `prisma migrate diff --from-migrations ... --to-schema-datamodel ... --shadow-database-url ...` → должно быть `No difference detected`.
- CI workflow `prisma-check.yml` это проверяет автоматически.

### Style

- TypeScript строгий (`strict: true`, `exactOptionalPropertyTypes: true`).
- Никакого `any`, кроме крайних случаев с явным комментарием.
- Именованные экспорты (`export function foo` или `export class Foo`), не `export default` для бизнес-логики (default только для Next.js pages / Routes).
- Функциональные компоненты с `React.FC<Props>` или `function ComponentName(props: Props): React.ReactElement`.

## Запретные зоны

Не редактировать без явного запроса (или issue):

- `docs/LEGAL/` — юридические документы (требуют юриста)
- `apps/api/prisma/migrations/*.sql` — applied migrations НЕ редактируются (write new only)
- `apps/api/prisma/seed/tours/*.json` — content-зона founder'а (без crud-запроса)
- `LICENSE` — proprietary, не open-source-ить
- `.github/workflows/deploy-dev.yml` — deploy-config, devops:vika territory

## Когда создавать issue для Vика (devops AI)

Любое действие, требующее серверных прав:
- `pnpm install` на dev/prod
- `prisma migrate deploy` на staging/prod
- DNS / S3 / Vault / GitHub admin (branch protection, environments, secrets)
- Платёжные шлюзы / SMS-провайдеры
- Ротации ключей

Формат — см. CLAUDE.md § 7.

## Когда задавать вопросы founders

Помечать issue лейблом `статус: нужна инфа` если:
- Лицензионные / юридические решения
- Бюджетные решения (платная подписка, аккаунт у вендора)
- Стратегические решения масштаба эпика
- Конкретные тексты для пользователя (CTA, headers, маркетинг)

## Recommendation principle (CLAUDE.md § 6)

Каждое значимое изменение → блок `> **Рекомендация:** ...` с обоснованием **почему**. Не молчать о trade-off'ах. См. примеры в недавних PR'ах #371-#385.

## Recovery / rollback

- При сломе `main` — НЕ force-push'ить. Создать revert-PR (`git revert <sha>` → push → merge).
- При застрявшем CI — диагностируем root-cause, не выключаем check.
- При случайно закомиченном секрете — НЕМЕДЛЕННО:
  1. Создать P0 issue для Vика (rotation + history-cleanup через BFG).
  2. Не push'ить дальше до резолва.

## Связанные документы

- `CLAUDE.md` — общие принципы IndiaHorizone
- `CONTRIBUTING.md` — PR-чеклист
- `docs/ai/VIKA_RULES.md` — что делает Vика (граница ответственности)
- `docs/ai/EXTERNAL_TASKS.md` — задачи для внешних исполнителей
- `docs/ai/AUTOMATION.md` — описание GitHub Actions автоматизации
