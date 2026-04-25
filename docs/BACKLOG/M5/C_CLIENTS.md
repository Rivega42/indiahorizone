# Slice C — Clients + согласия + ПДн

> Goal: «Профиль клиента создаётся, ПДн зашифрованы, 4 типа согласия (PDN/photo-video/geo/emergency) можно дать и отозвать. Hot-read только с 2FA для скана паспорта».
> Покрывает [`USER_STORIES.md` US-CL-3](../../USER_STORIES.md), [`docs/LEGAL/CONSENTS/`](../../LEGAL/CONSENTS/).

## IH-M5-C-001 — feat(clients): модель Client + ClientProfile

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** B-001
- **Acceptance:**
  - [ ] `Client` (id, userId unique, createdAt)
  - [ ] `ClientProfile` (clientId, firstName, lastName, dateOfBirth, citizenship, phone, telegramHandle, preferences JSONB)
  - [ ] Подписан на `auth.user.registered` → создаёт пустой Client
  - [ ] Тест: после register → профиль есть
- **Files:** `apps/api/src/modules/clients/*`, миграция
- **Labels:** `area:clients`, `slice:C`, `priority:p0`, `type:feat`

## IH-M5-C-002 — feat(clients): ПДн column-level encryption

- **Type:** feat — **Estimate:** 6h — **Owner:** backend — **Deps:** C-001
- **Acceptance:**
  - [ ] AES-256-GCM helper в `packages/shared/crypto`
  - [ ] Master-key из env (для dev) / KMS (для prod)
  - [ ] Prisma middleware шифрует поля `passport_*`, `phone_encrypted` на write, расшифровывает на read
  - [ ] Логи **не содержат** plaintext ПДн (PII redaction в pino)
  - [ ] Тест: SQL `SELECT` напрямую возвращает зашифрованный байт
- **Files:** `packages/shared/crypto/*`, `apps/api/src/common/prisma/middleware/encrypt.ts`
- **Labels:** `area:clients`, `slice:C`, `priority:p0`, `type:feat`
- **Notes:** См. [`MICROSERVICES.md` § 2 clients-svc](../../ARCH/MICROSERVICES.md). Шифруем колонки, не строки целиком — чтобы можно было `SELECT firstName` без расшифровки паспорта.

## IH-M5-C-003 — feat(clients): эндпоинты профиля /clients/me

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** C-001
- **Acceptance:**
  - [ ] `GET /clients/me` → профиль текущего user
  - [ ] `PATCH /clients/me` обновляет non-ПДн поля
  - [ ] Публикует `clients.profile.updated` с массивом изменённых полей
  - [ ] Защищён `@Roles('client')` + RBAC
- **Files:** `apps/api/src/modules/clients/clients.controller.ts`
- **Labels:** `area:clients`, `slice:C`, `priority:p0`, `type:feat`

## IH-M5-C-004 — feat(clients): загрузка скана паспорта

- **Type:** feat — **Estimate:** 6h — **Owner:** backend — **Deps:** C-002, F-002
- **Acceptance:**
  - [ ] `POST /clients/me/passport` принимает `mediaId` (после загрузки в media-svc)
  - [ ] Mime-type whitelist (jpg/png/pdf), размер ≤ 10 МБ — проверяется в media-svc
  - [ ] Метаданные (passport_series, passport_number, expiry) — поля зашифрованы
  - [ ] Доступ к скану — только через `GET /clients/me/passport` с **обязательным 2FA recheck** (last 5 min)
  - [ ] Публикует `clients.passport.uploaded`
- **Files:** `apps/api/src/modules/clients/passport.service.ts`
- **Labels:** `area:clients`, `slice:C`, `priority:p0`, `type:feat`
- **Notes:** 2FA recheck перед чтением скана — критично, защищает при компрометации сессии.

## IH-M5-C-005 — feat(clients): модель Consent + 4 типа

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** C-001
- **Acceptance:**
  - [ ] `Consent` (id, clientId, type enum: pdn|photo_video|geo|emergency_contacts, scope JSONB, version, grantedAt, revokedAt nullable)
  - [ ] Уникальный constraint: один активный (revokedAt IS NULL) consent на (client, type)
  - [ ] Сидер: типы и текущие версии текстов из `docs/LEGAL/CONSENTS/*.md`
- **Files:** `apps/api/prisma/schema.prisma`, миграция
- **Labels:** `area:clients`, `slice:C`, `priority:p0`, `type:feat`

## IH-M5-C-006 — feat(clients): granular consent endpoints

- **Type:** feat — **Estimate:** 5h — **Owner:** backend — **Deps:** C-005
- **Acceptance:**
  - [ ] `POST /clients/me/consents/:type` принимает `{ scope }` (для photo_video — уровни 1–4; для geo — A/B/C/D)
  - [ ] `DELETE /clients/me/consents/:type` ставит `revokedAt`, публикует `clients.consent.revoked`
  - [ ] `GET /clients/me/consents` возвращает все актуальные
  - [ ] Аудит включает старый и новый scope
- **Files:** `apps/api/src/modules/clients/consents/*`
- **Labels:** `area:clients`, `slice:C`, `priority:p0`, `type:feat`
- **Notes:** Соответствует [`docs/LEGAL/CONSENTS/PHOTO_VIDEO.md`](../../LEGAL/CONSENTS/PHOTO_VIDEO.md), [`GEO.md`](../../LEGAL/CONSENTS/GEO.md).

## IH-M5-C-007 — feat(clients): emergency contacts CRUD

- **Type:** feat — **Estimate:** 5h — **Owner:** backend — **Deps:** C-002
- **Acceptance:**
  - [ ] `EmergencyContact` (id, clientId, name encrypted, phone encrypted, relation, language, priority enum: primary|secondary)
  - [ ] `POST/GET/PATCH/DELETE /clients/me/emergency-contacts/:id?`
  - [ ] Максимум 2 контакта на клиента (primary + secondary)
  - [ ] Требует активный `Consent` типа `emergency_contacts`
  - [ ] Публикует `clients.emergency_contact.added`
- **Files:** `apps/api/src/modules/clients/emergency-contacts/*`
- **Labels:** `area:clients`, `slice:C`, `priority:p0`, `type:feat`

## IH-M5-C-008 — feat(clients): retention job (delete expired data)

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** C-002, C-005
- **Acceptance:**
  - [ ] Scheduled job (cron daily 03:00 UTC) удаляет:
    - скан паспорта через 6 мес после последней поездки
    - ПДн через 3 года после последнего обслуживания
    - emergency contacts при отзыве consent
  - [ ] Логирует каждое удаление в audit-svc
  - [ ] Soft-delete + permanent-delete через 7 дней recoverable window
- **Files:** `apps/api/src/modules/clients/retention.scheduler.ts`
- **Labels:** `area:clients`, `slice:C`, `priority:p1`, `type:feat`
- **Notes:** См. [`docs/LEGAL/PDN.md` § Retention](../../LEGAL/PDN.md).

## IH-M5-C-009 — feat(clients): DSAR (data subject access request)

- **Type:** feat — **Estimate:** 6h — **Owner:** backend — **Deps:** C-002
- **Acceptance:**
  - [ ] `POST /clients/me/dsar/export` → создаёт async задачу, отправляет email с ссылкой через 24 часа
  - [ ] Архив: профиль, поездки, фидбэк, согласия, audit о клиенте
  - [ ] `POST /clients/me/dsar/delete` → каскадное удаление через retention service (с подтверждением через email)
  - [ ] Учитывает финансовые данные — оставляются на 5 лет (налоговый учёт), помечаются «pseudonymized»
- **Files:** `apps/api/src/modules/clients/dsar/*`
- **Labels:** `area:clients`, `slice:C`, `priority:p1`, `type:feat`
- **Notes:** 152-ФЗ ст. 14 — право на доступ к ПДн.

## IH-M5-C-010 — feat(web): экраны профиля и согласий

- **Type:** feat — **Estimate:** 8h — **Owner:** frontend — **Deps:** C-003, C-006, C-007
- **Acceptance:**
  - [ ] `/profile` — просмотр и редактирование non-ПДн полей
  - [ ] `/profile/consents` — granular UI для каждого типа (чекбоксы уровней)
  - [ ] `/profile/emergency-contacts` — форма с валидацией международного телефона
  - [ ] `/profile/passport` — upload скана с прогресс-баром, требует 2FA
  - [ ] Все формы — accessibility, русский UI
- **Files:** `apps/web/app/profile/*`
- **Labels:** `area:web`, `slice:C`, `priority:p0`, `type:feat`

## IH-M5-C-011 — test(clients): e2e ПДн + согласия

- **Type:** test — **Estimate:** 5h — **Owner:** qa — **Deps:** C-010
- **Acceptance:**
  - [ ] Сценарий: register → заполнить профиль → дать 4 согласия (granular scope) → отозвать одно → проверить, что revokedAt стоит
  - [ ] Сценарий: попытка прочитать паспорт без 2FA → 403
  - [ ] Сценарий: DSAR export → email с архивом
  - [ ] Сценарий: DSAR delete → данные ушли (но финансы остались pseudonymized)
- **Files:** `apps/web/tests/clients.spec.ts`
- **Labels:** `area:clients`, `slice:C`, `priority:p0`, `type:test`

## Slice C — итог

11 issues, ≈ 57 часов.

**DoD:** профиль работает, ПДн зашифрованы, 4 согласия с granular scope, retention автоматический, DSAR — экспорт и удаление, e2e зелёный.
