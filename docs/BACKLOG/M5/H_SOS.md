# Slice H — SOS production

> Goal: «Клиент удерживает кнопку 2 сек → SOS улетел concierge с гео + контекстом → ack ≤ 60 сек или эскалация. SMS-fallback при отсутствии IP».
> Покрывает [`USER_STORIES.md` US-CL-7, US-GD-4, US-AD-2](../../USER_STORIES.md), [`docs/SOS/CONCEPT.md`](../../SOS/CONCEPT.md), [`TECH.md`](../../SOS/TECH.md), [`FALLBACK.md`](../../SOS/FALLBACK.md).

## IH-M5-H-001 — feat(sos): модель SosEvent + статусы

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** A-006, D-001
- **Acceptance:**
  - [ ] `SosEvent` (id, clientId, tripId, type: medical|police|transport|documents|unknown, status: triggered|acked|escalated|resolved, geo JSONB, context JSONB, triggeredAt, ackedAt nullable, resolvedAt nullable, ackTimeMs)
  - [ ] `SosAck` (sosId, conciergeId, ackedAt)
  - [ ] `SosEscalation` (sosId, level: L2|L3|L4, escalatedTo, escalatedAt, reason)
  - [ ] Strict status-machine
- **Files:** `apps/api/src/modules/sos/*`, миграция
- **Labels:** `area:sos`, `slice:H`, `priority:p0`, `type:feat`

## IH-M5-H-002 — feat(sos): trigger endpoint

- **Type:** feat — **Estimate:** 5h — **Owner:** backend — **Deps:** H-001, A-009
- **Acceptance:**
  - [ ] `POST /sos` принимает `{type?, geo, context}` от client
  - [ ] Создаёт SosEvent в статусе `triggered`
  - [ ] Публикует `sos.triggered` через outbox в **отдельный stream** `events.sos.priority`
  - [ ] Idempotency-Key обязателен (защита от двойного триггера)
  - [ ] Возвращает `{sosId, expectedAckBySec}`
  - [ ] Доступен без 2FA (в SOS блокировка вторым фактором — недопустима)
- **Files:** `apps/api/src/modules/sos/sos.controller.ts`
- **Labels:** `area:sos`, `slice:H`, `priority:p0`, `type:feat`
- **Notes:** Соответствует [`MICROSERVICES.md` § sos-svc](../../ARCH/MICROSERVICES.md). Отдельный stream — гарантия SLA.

## IH-M5-H-003 — feat(sos): ack endpoint + SLA-таймер

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** H-002
- **Acceptance:**
  - [ ] `POST /sos/:id/ack` (только concierge на смене) → status=`acked`, ackTimeMs = now - triggeredAt
  - [ ] Публикует `sos.acked`
  - [ ] Таймер запускается при `sos.triggered`: при отсутствии ack за 60s (день) / 180s (ночь) — `sos.sla.breach` + auto-escalate L2
- **Files:** `apps/api/src/modules/sos/sla-timer.service.ts`
- **Labels:** `area:sos`, `slice:H`, `priority:p0`, `type:feat`

## IH-M5-H-004 — feat(sos): эскалация по уровням

- **Type:** feat — **Estimate:** 6h — **Owner:** backend — **Deps:** H-003
- **Acceptance:**
  - [ ] `POST /sos/:id/escalate` (concierge или auto)
  - [ ] Levels: L2 = резерв concierge + Shivam; L3 = Roman + Shivam; L4 = founders + emergency contact (с двойным согласием)
  - [ ] Публикует `sos.escalated`
  - [ ] comm-svc слушает → priority push + автозвонок (Twilio)
- **Files:** `apps/api/src/modules/sos/escalation.service.ts`
- **Labels:** `area:sos`, `slice:H`, `priority:p0`, `type:feat`
- **Notes:** См. [`docs/OPS/ESCALATION.md`](../../OPS/ESCALATION.md).

## IH-M5-H-005 — feat(sos): SMS-fallback при отсутствии IP

- **Type:** feat — **Estimate:** 5h — **Owner:** backend — **Deps:** E-003, H-002
- **Acceptance:**
  - [ ] Endpoint для SMS-gateway: входящие SMS на специальный номер (с keyword `SOS`) парсятся → создают SosEvent
  - [ ] Отправитель идентифицируется по phone в Client.profile или emergency_contact
  - [ ] Auto-reply SMS «принято, помощь идёт, имя X»
  - [ ] Бумажная карточка SOS (см. `docs/SOS/FALLBACK.md`) содержит этот номер
- **Files:** `apps/api/src/modules/sos/sms-fallback.controller.ts`
- **Labels:** `area:sos`, `slice:H`, `priority:p0`, `type:feat`

## IH-M5-H-006 — feat(sos): post-incident отчёт

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** H-001
- **Acceptance:**
  - [ ] `POST /sos/:id/resolve` принимает `{outcome, summary}`
  - [ ] `POST /sos/:id/post-incident` (concierge или founder) — отчёт в формате [`docs/SOS/POST_INCIDENT.md`](../../SOS/POST_INCIDENT.md)
  - [ ] Дает сохраняется как `SosPostIncident` (sosId, summary, rootCause, actionItems[], submittedBy, submittedAt)
  - [ ] Публикует `sos.post_incident.submitted`
- **Files:** `apps/api/src/modules/sos/post-incident.service.ts`
- **Labels:** `area:sos`, `slice:H`, `priority:p1`, `type:feat`

## IH-M5-H-007 — feat(web): SOS-кнопка hold-to-trigger

- **Type:** feat — **Estimate:** 6h — **Owner:** frontend — **Deps:** H-002
- **Acceptance:**
  - [ ] Floating button на каждом экране Trip Dashboard
  - [ ] Hold 2 sec — заполняется индикатор → trigger
  - [ ] 10 sec window для отмены после trigger
  - [ ] Передаёт геолокацию (если consent geo level A)
  - [ ] Если оффлайн — outbox + сразу UI-feedback «помощь запрошена»
  - [ ] Большой и заметный (минимум 60×60 px)
- **Files:** `apps/web/components/sos/SosButton.tsx`
- **Labels:** `area:web`, `slice:H`, `priority:p0`, `type:feat`
- **Notes:** См. [`UX/FEATURES/CORE.md` § SOS](../../UX/FEATURES/CORE.md), [`SOS/FALSE_POSITIVE.md`](../../SOS/FALSE_POSITIVE.md).

## IH-M5-H-008 — feat(web): SOS-экран после trigger

- **Type:** feat — **Estimate:** 4h — **Owner:** frontend — **Deps:** H-007
- **Acceptance:**
  - [ ] Заметный экран «Помощь идёт. Дежурный — Х. ETA ack ~60 сек»
  - [ ] При получении `sos.acked` (через WS) — меняется на «На связи: Х. Опишите ситуацию»
  - [ ] Открыт чат
  - [ ] Live-обновление статуса
- **Files:** `apps/web/app/sos/active/*`
- **Labels:** `area:web`, `slice:H`, `priority:p0`, `type:feat`

## IH-M5-H-009 — feat(web): concierge SOS dashboard

- **Type:** feat — **Estimate:** 8h — **Owner:** frontend — **Deps:** H-003, E-009
- **Acceptance:**
  - [ ] `/concierge/sos` — список активных SOS, отсортированных по triggeredAt
  - [ ] Каждая карточка: клиент, поездка, тип, гео, context, ack-таймер
  - [ ] Кнопка «принять» (1 клик)
  - [ ] Кнопка «эскалировать»
  - [ ] Звуковой alert при новом SOS
  - [ ] Live-обновление через WS
- **Files:** `apps/web/app/concierge/sos/*`
- **Labels:** `area:web`, `slice:H`, `priority:p0`, `type:feat`

## IH-M5-H-010 — test(sos): e2e SOS scenario

- **Type:** test — **Estimate:** 6h — **Owner:** qa — **Deps:** H-009
- **Acceptance:**
  - [ ] Сценарий: client trigger → concierge получает push в ≤ 5 sec → ack в 30 sec
  - [ ] Сценарий: concierge не отвечает 60 sec → auto-escalate L2 → Shivam получает push
  - [ ] Сценарий: airplane mode → SMS-fallback приходит и создаёт SOS
  - [ ] Сценарий: false-positive — клиент отменил в 5 sec → cancel
- **Files:** `apps/web/tests/sos.spec.ts`
- **Labels:** `area:sos`, `slice:H`, `priority:p0`, `type:test`

## Slice H — итог

10 issues, ≈ 52 часа.

**DoD:** SOS работает on-/offline, ack-SLA соблюдается, эскалация по уровням, post-incident отчёт.
