# Slice E — comm-svc + чат + уведомления

> Goal: «Все исходящие коммуникации идут через comm-svc. Push (FCM/APNs), email (SMTP), SMS (провайдер), Telegram-бот. Чат клиент↔concierge с realtime».
> Покрывает [`USER_STORIES.md` US-CC-1](../../USER_STORIES.md), [`MICROSERVICES.md § 5 comm-svc`](../../ARCH/MICROSERVICES.md).

## IH-M5-E-001 — feat(comm): абстракция notification + email-провайдер

- **Type:** feat — **Estimate:** 6h — **Owner:** backend — **Deps:** A-006
- **Acceptance:**
  - [ ] `Notification` модель (id, channel, recipient, templateId, payload, status, sentAt)
  - [ ] `NotifyService.send({channel, to, template, data})` — единая точка
  - [ ] Адаптер `EmailProvider` (SMTP через nodemailer) с DKIM
  - [ ] Templates через Handlebars в `apps/api/src/modules/comm/templates/`
  - [ ] Публикует `comm.message.sent`, `comm.message.failed`
- **Files:** `apps/api/src/modules/comm/*`
- **Labels:** `area:comm`, `slice:E`, `priority:p0`, `type:feat`

## IH-M5-E-002 — feat(comm): push-провайдер FCM + APNs

- **Type:** feat — **Estimate:** 8h — **Owner:** backend — **Deps:** E-001
- **Acceptance:**
  - [ ] `DeviceToken` модель (userId, token, platform: ios|android|web, deviceId, lastSeenAt)
  - [ ] `POST /devices/register` принимает токен от клиента
  - [ ] FCM-адаптер для android/web, APNs для iOS
  - [ ] При invalid token → удаление из БД
  - [ ] Отдельный stream `events.comm.push.priority` для SOS (см. EVENTS.md)
- **Files:** `apps/api/src/modules/comm/push/*`
- **Labels:** `area:comm`, `slice:E`, `priority:p0`, `type:feat`

## IH-M5-E-003 — feat(comm): SMS-провайдер (Twilio / российский)

- **Type:** feat — **Estimate:** 5h — **Owner:** backend — **Deps:** E-001
- **Acceptance:**
  - [ ] Адаптер с двумя провайдерами: Twilio (для +91, +международных), российский SMS-агрегатор (TBD) для +7
  - [ ] Routing по country code номера
  - [ ] Fallback при failure первого провайдера
  - [ ] Используется для SOS-fallback и password-reset SMS
- **Files:** `apps/api/src/modules/comm/sms/*`
- **Labels:** `area:comm`, `slice:E`, `priority:p0`, `type:feat`
- **Notes:** См. [`docs/SOS/FALLBACK.md`](../../SOS/FALLBACK.md). Российский провайдер обязательно с лицензией Роскомнадзора.

## IH-M5-E-004 — feat(comm): Telegram Bot интеграция

- **Type:** feat — **Estimate:** 6h — **Owner:** backend — **Deps:** E-001
- **Acceptance:**
  - [ ] Telegram bot token в Vault
  - [ ] Linkage: user привязывает свой Telegram через deep-link с одноразовым токеном
  - [ ] `TelegramProvider.send(chatId, template, data)`
  - [ ] Webhook от Telegram → events `comm.telegram.message.received`
- **Files:** `apps/api/src/modules/comm/telegram/*`
- **Labels:** `area:comm`, `slice:E`, `priority:p1`, `type:feat`

## IH-M5-E-005 — feat(comm): notification subscriptions / preferences

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** E-002
- **Acceptance:**
  - [ ] `NotificationPreference` (userId, type, channels[]: push|email|sms|telegram, enabled)
  - [ ] `GET/PATCH /comm/preferences`
  - [ ] Defaults: trips push+email, marketing email-only opt-in, SOS — все каналы (нельзя выключить)
  - [ ] Service учитывает preferences перед send
- **Files:** `apps/api/src/modules/comm/preferences/*`
- **Labels:** `area:comm`, `slice:E`, `priority:p1`, `type:feat`
- **Notes:** SOS-канал — protected, всегда включён. Маркетинг — opt-in (152-ФЗ).

## IH-M5-E-006 — feat(comm): чат — модель ChatThread + Message

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** A-006
- **Acceptance:**
  - [ ] `ChatThread` (id, kind: trip|sos|sales, subjectId, participants[], status)
  - [ ] `ChatMessage` (id, threadId, fromUserId, body, attachments[], createdAt, readBy{})
  - [ ] Index по threadId+createdAt
- **Files:** `apps/api/src/modules/comm/chat/*`, миграция
- **Labels:** `area:comm`, `slice:E`, `priority:p0`, `type:feat`

## IH-M5-E-007 — feat(comm): WebSocket gateway для realtime чата

- **Type:** feat — **Estimate:** 6h — **Owner:** backend — **Deps:** E-006
- **Acceptance:**
  - [ ] `@WebSocketGateway` на `/ws/chat`
  - [ ] Аутентификация через JWT в connection params
  - [ ] Events: `message:new`, `message:read`, `typing:start`, `typing:stop`
  - [ ] Sticky session или Redis adapter (для multi-instance)
- **Files:** `apps/api/src/modules/comm/chat/chat.gateway.ts`
- **Labels:** `area:comm`, `slice:E`, `priority:p0`, `type:feat`

## IH-M5-E-008 — feat(comm): чат REST endpoints

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** E-006
- **Acceptance:**
  - [ ] `GET /chat/threads` — список тредов user
  - [ ] `GET /chat/threads/:id/messages?cursor=...` — пагинация по cursor
  - [ ] `POST /chat/threads/:id/messages` — отправить (для offline-fallback)
  - [ ] `POST /chat/threads/:id/read` — отметить прочитанным
  - [ ] Idempotency-Key обязателен на POST
- **Files:** `apps/api/src/modules/comm/chat/chat.controller.ts`
- **Labels:** `area:comm`, `slice:E`, `priority:p0`, `type:feat`

## IH-M5-E-009 — feat(web): чат UI клиент↔concierge

- **Type:** feat — **Estimate:** 8h — **Owner:** frontend — **Deps:** E-007, E-008
- **Acceptance:**
  - [ ] `/trips/:id/chat` и `/concierge/inbox` (для concierge)
  - [ ] Сообщения live через WS, fallback long-polling
  - [ ] Typing-indicator
  - [ ] Read-receipts
  - [ ] Offline: outbox для исходящих сообщений
  - [ ] Optimistic UI
- **Files:** `apps/web/components/chat/*`
- **Labels:** `area:web`, `slice:E`, `priority:p0`, `type:feat`

## IH-M5-E-010 — feat(comm): rate-limit / anti-spam для исходящих

- **Type:** feat — **Estimate:** 3h — **Owner:** backend — **Deps:** E-001
- **Acceptance:**
  - [ ] Per-user лимит на push (≤ 20/час non-SOS)
  - [ ] Per-user лимит на SMS (≤ 5/день non-SOS)
  - [ ] SOS exempted
  - [ ] Превышение → лог + queue, не блок
- **Files:** `apps/api/src/modules/comm/rate-limit.service.ts`
- **Labels:** `area:comm`, `slice:E`, `priority:p1`, `type:feat`
- **Notes:** Защищает от баг-цикла «пуш → пуш → пуш».

## IH-M5-E-011 — test(comm): e2e чат + push

- **Type:** test — **Estimate:** 5h — **Owner:** qa — **Deps:** E-009
- **Acceptance:**
  - [ ] Сценарий: client пишет → concierge видит мгновенно (WS)
  - [ ] Read-receipts работают в обе стороны
  - [ ] Offline: client пишет в airplane mode → доставляется при reconnect
  - [ ] Push приходит при offline-получателе
- **Files:** `apps/web/tests/comm.spec.ts`
- **Labels:** `area:comm`, `slice:E`, `priority:p0`, `type:test`

## Slice E — итог

11 issues, ≈ 59 часов.

**DoD:** все 4 канала (push/email/SMS/Telegram) работают, чат realtime + offline-outbox, preferences, rate-limit.
