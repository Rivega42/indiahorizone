# Состояние проекта

> **Актуализуется** после каждой значимой сессии (фича/PR-batch). Если редактируешь код больше 30 минут — обнови этот файл в конце.

**Дата обновления:** 2026-04-29
**Версия:** v0.5.0-phase3 (Phase 3 MVP, pre-launch)
**Стадия:** Backend M5 практически done, frontend Tour Landing готов, push pipeline end-to-end. До запуска нужны: legal review, VAPID keys в Vault, S3 (Beget), email provider creds.

## В работе сейчас

- `chore/repo-setup` (этот PR) — применяем `repo-setup-kit` для автоматизации Project board, лейблов, sub-issue rollup, weekly digest, dependency resolver.

## Заблокировано (внешние зависимости)

| Что | Кто | Issue |
|---|---|---|
| Установить VAPID keys в env (dev) и Vault (prod) | Vika (devops) | #379 |
| Beget Object Storage credentials для media (#350) | founders | #350 |
| Email provider creds (Mailganer / Yandex / Postmark) для prod SMTP | founders | #349 |
| Юридический review `/privacy` + `/consent` | founders + юрист | #307 (DRAFT) |
| ИНН/ОГРН/юр.адрес для FooterLegal | founders | #306 |
| `PROJECT_TOKEN` PAT rotation (валидный для project-automation) | Vika | (новый issue по итогам ШАГА 8) |

## Известные проблемы

- **`project-automation.yml` workflow "PR opened → In Progress" check** проваливается на каждом PR из-за expired/missing `PROJECT_TOKEN`. Не блокер для merge, но красный X в UI. Будет починено через kit-workflow `auto-labels.yml` после ротации токена.
- Тестовое покрытие — TODO-stubs (нет реальных юнит-тестов / e2e). Технический долг, признан, в backlog.

## Следующие шаги (по роадмапу)

### Phase 3 → Production launch

1. **Доставить блокеры** (см. таблицу выше): VAPID, S3, SMTP, legal review.
2. **2FA frontend UI** (#170) → разблокирует Playwright e2e (#137).
3. **Trip Dashboard frontend** (#152-#161) — клиентский кабинет: программа, документы, чат, SOS.
4. **SOS module** (#192) backend — `SosEvent`, `SosAck`, `SosEscalation` модели + dispatcher.
5. **Marketing homepage `/`** (EPIC 13) — заменить DEV-nav на полноценную landing (прототип в `apps/web/public/prototypes/homepage.html`).

### Phase 4 — после первых платящих клиентов

- Native push (FCM/APNs) — фаза 4 заявка.
- Microservices extraction (auth-svc + comm-svc первыми кандидатами).
- Trip Dashboard mobile (React Native).
- Admin Panel (#311 V2) — UI для управления каталогом туров.

## Метрики

См. `docs/TZ/MVP_PHASE3.md § Метрики успеха фазы 3 → фазы 4`.

## Ссылки

- **GitHub Project:** https://github.com/users/Rivega42/projects/3
- **Roadmap:** `ROADMAP.md` → `docs/TZ/MVP_PHASE3.md`
- **Backlog:** `BACKLOG.md` → `docs/BACKLOG/M5/`
- **Решения (ADR):** `DECISIONS.md`
- **Аудит репо:** `AUDIT.md`
