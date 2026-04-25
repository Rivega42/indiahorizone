# Slice B — Auth + RBAC

> Goal: «Пользователь регистрируется, логинится, может включить 2FA, токены ротируются. RBAC проверяется на каждом protected эндпоинте».
> Закрывает [`docs/ARCH/SECURITY/2FA.md`](../../ARCH/SECURITY/2FA.md) base + part of [`USER_STORIES.md` US-CL-2](../../USER_STORIES.md).

## IH-M5-B-001 — feat(auth): User модель и Prisma-схема

- **Type:** feat — **Estimate:** 3h — **Owner:** backend — **Deps:** A-007
- **Acceptance:**
  - [ ] Модель `User`: `id, email (unique, ci), passwordHash, role (enum: client|guide|manager|concierge|finance|admin), status (active|suspended|pending), createdAt, updatedAt`
  - [ ] Email lowercased + validated на уровне приложения
  - [ ] Index на `email`
  - [ ] Миграция применяется
- **Files:** `apps/api/prisma/schema.prisma`, миграция
- **Labels:** `area:auth`, `slice:B`, `priority:p0`, `type:feat`

## IH-M5-B-002 — feat(auth): регистрация (email + password)

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** B-001, A-009
- **Acceptance:**
  - [ ] `POST /auth/register` принимает `{email, password, role?}`
  - [ ] Пароль ≥ 12 символов, проверка через zxcvbn
  - [ ] argon2id хеш
  - [ ] Публикует `auth.user.registered` через outbox
  - [ ] 409 если email занят
  - [ ] Rate-limit 5 попыток / 15 мин на IP
- **Files:** `apps/api/src/modules/auth/*`
- **Labels:** `area:auth`, `slice:B`, `priority:p0`, `type:feat`
- **Notes:** role по умолчанию `client`; admin/finance — только через ручное продвижение.

## IH-M5-B-003 — feat(auth): login + JWT access + refresh

- **Type:** feat — **Estimate:** 6h — **Owner:** backend — **Deps:** B-002
- **Acceptance:**
  - [ ] `POST /auth/login` → `{ accessToken (15 мин), refreshToken (30 дней) }`
  - [ ] refresh token хранится в `Session` (id, userId, refreshTokenHash, ip, userAgent, expiresAt)
  - [ ] argon2id verify пароля, time-constant
  - [ ] Публикует `auth.user.logged_in`
  - [ ] При неуспехе — generic «invalid credentials» (без раскрытия, существует ли email)
  - [ ] Rate-limit 10 попыток / 15 мин на email
- **Files:** `apps/api/src/modules/auth/*`, `Session` модель
- **Labels:** `area:auth`, `slice:B`, `priority:p0`, `type:feat`

## IH-M5-B-004 — feat(auth): refresh-token rotation

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** B-003
- **Acceptance:**
  - [ ] `POST /auth/refresh` принимает refresh token
  - [ ] При успехе — invalidate старый, выпустить новый pair
  - [ ] Detection reuse: если старый refresh уже использован → invalidate **все** сессии user
  - [ ] Тест: reuse → 401 + все сессии убиты
- **Files:** `apps/api/src/modules/auth/refresh.service.ts`
- **Labels:** `area:auth`, `slice:B`, `priority:p0`, `type:feat`
- **Notes:** Это базовая защита от утечки refresh-token. Без detection-reuse refresh-токены — бесконтрольный root-access.

## IH-M5-B-005 — feat(auth): logout + logout-all-devices

- **Type:** feat — **Estimate:** 2h — **Owner:** backend — **Deps:** B-003
- **Acceptance:**
  - [ ] `POST /auth/logout` инвалидирует текущую сессию
  - [ ] `POST /auth/logout-all` инвалидирует все сессии user
  - [ ] Публикует `auth.user.logout`
- **Files:** `apps/api/src/modules/auth/*`
- **Labels:** `area:auth`, `slice:B`, `priority:p0`, `type:feat`

## IH-M5-B-006 — feat(auth): RBAC guard + role decorator

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** B-003
- **Acceptance:**
  - [ ] `@Roles('client', 'concierge')` декоратор
  - [ ] `RolesGuard` проверяет роль из JWT-claim
  - [ ] `@Public()` декоратор для unauthenticated-эндпоинтов
  - [ ] Тесты: правильная роль → 200; неправильная → 403; нет токена → 401
- **Files:** `apps/api/src/common/auth/*`
- **Labels:** `area:auth`, `slice:B`, `priority:p0`, `type:feat`

## IH-M5-B-007 — feat(auth): 2FA TOTP enrollment

- **Type:** feat — **Estimate:** 6h — **Owner:** backend — **Deps:** B-003
- **Acceptance:**
  - [ ] `POST /auth/2fa/enroll` → возвращает secret + QR-URL (otpauth://...)
  - [ ] secret хранится зашифрованно (KMS / AES-GCM с master key из env)
  - [ ] `POST /auth/2fa/verify-enroll` принимает код, активирует 2FA
  - [ ] При активации генерируются 10 recovery codes (хешированы)
  - [ ] Публикует `auth.2fa.enabled`
- **Files:** `apps/api/src/modules/auth/two-fa/*`
- **Labels:** `area:auth`, `slice:B`, `priority:p0`, `type:feat`
- **Notes:** См. [`docs/ARCH/SECURITY/2FA.md`](../../ARCH/SECURITY/2FA.md). 2FA обязательна для finance, admin; рекомендована для concierge, manager.

## IH-M5-B-008 — feat(auth): 2FA verify при login

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** B-007
- **Acceptance:**
  - [ ] Если у user 2FA включён → `POST /auth/login` возвращает `{ challengeId }` без токенов
  - [ ] `POST /auth/2fa/verify` принимает `{ challengeId, code }` → выпускает токены
  - [ ] Recovery code также принимается (одноразовый)
  - [ ] Rate-limit 5 попыток на challengeId
  - [ ] TTL challenge — 5 минут
- **Files:** `apps/api/src/modules/auth/two-fa/*`
- **Labels:** `area:auth`, `slice:B`, `priority:p0`, `type:feat`

## IH-M5-B-009 — feat(auth): password reset через email

- **Type:** feat — **Estimate:** 5h — **Owner:** backend — **Deps:** B-002, E-001
- **Acceptance:**
  - [ ] `POST /auth/password/reset-request` принимает email, отправляет письмо со ссылкой
  - [ ] Токен — UUIDv4, hash в БД, TTL 30 минут, single-use
  - [ ] `POST /auth/password/reset` принимает `{token, newPassword}` → меняет пароль, инвалидирует все сессии
  - [ ] При несуществующем email — `204` (anti-enumeration)
  - [ ] Публикует `auth.password.changed`
- **Files:** `apps/api/src/modules/auth/password-reset/*`
- **Labels:** `area:auth`, `slice:B`, `priority:p0`, `type:feat`

## IH-M5-B-010 — feat(web): экраны register / login / 2FA

- **Type:** feat — **Estimate:** 8h — **Owner:** frontend — **Deps:** B-002, B-003, B-008, A-013
- **Acceptance:**
  - [ ] `/register` форма с валидацией пароля (zxcvbn meter)
  - [ ] `/login` форма + редирект на 2FA если challenge
  - [ ] `/2fa-setup` экран с QR-кодом + recovery codes (одноразовый показ + скачать)
  - [ ] `/forgot-password` + `/reset-password/:token`
  - [ ] Все формы — accessibility (aria-labels, focus-traps в модалах)
  - [ ] Только русский UI
- **Files:** `apps/web/app/(auth)/*`
- **Labels:** `area:web`, `slice:B`, `priority:p0`, `type:feat`

## IH-M5-B-011 — feat(auth): suspicious-session detection

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** B-003
- **Acceptance:**
  - [ ] При login сравнить IP-страну и UA с предыдущей сессией
  - [ ] Если другая страна или сильно отличающийся UA → публикация `auth.session.suspicious`
  - [ ] Comm-svc отправляет email «новый вход с устройства X из страны Y»
  - [ ] User может пометить «это был я» / «не я» (последнее = logout-all + force password change)
- **Files:** `apps/api/src/modules/auth/suspicious-detector.ts`
- **Labels:** `area:auth`, `slice:B`, `priority:p1`, `type:feat`
- **Notes:** Опционально для базового MVP, но критично для admin/finance.

## IH-M5-B-012 — test(auth): e2e auth flow

- **Type:** test — **Estimate:** 6h — **Owner:** qa — **Deps:** B-010
- **Acceptance:**
  - [ ] Playwright-сценарий: register → email verify (mock) → login → enable 2FA → logout → login + 2FA → use recovery code
  - [ ] Сценарий: refresh-reuse → all sessions invalidated
  - [ ] Сценарий: rate-limit на login (10 попыток → 429)
  - [ ] CI запускает в headless
- **Files:** `apps/web/tests/auth.spec.ts`
- **Labels:** `area:auth`, `slice:B`, `priority:p0`, `type:test`

## Slice B — итог

12 issues, ≈ 56 часов (≈ 1.5–2 недели).

**Definition of Done:**
- Регистрация / login / logout работают
- JWT access + refresh с rotation и reuse-detection
- 2FA TOTP с recovery codes
- RBAC guard
- Suspicious-session алерт
- E2E тесты зелёные
