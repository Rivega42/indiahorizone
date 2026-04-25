# Slice G — feedback-svc + ежедневный фидбэк

> Goal: «В 19:00 локально клиент получает push, отвечает текстом или кружком. Negative-фидбэк автоматически алертит concierge».
> Покрывает [`USER_STORIES.md` US-CL-6](../../USER_STORIES.md), [`UX/FEATURES/CORE.md` § Фидбэк](../../UX/FEATURES/CORE.md).

## IH-M5-G-001 — feat(feedback): модели Feedback + FeedbackRequest

- **Type:** feat — **Estimate:** 3h — **Owner:** backend — **Deps:** A-006, D-001
- **Acceptance:**
  - [ ] `FeedbackRequest` (id, tripId, dayNumber, requestedAt, expiresAt)
  - [ ] `Feedback` (id, requestId nullable, tripId, dayNumber, type: text|circle, body, mood enum: 😔|😐|🙂|😊|🤩, mediaId nullable, signals JSONB, createdAt)
  - [ ] Один Feedback на (trip, dayNumber) — unique
- **Files:** `apps/api/src/modules/feedback/*`, миграция
- **Labels:** `area:feedback`, `slice:G`, `priority:p0`, `type:feat`

## IH-M5-G-002 — feat(feedback): scheduler — daily request 19:00 local

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** G-001, D-012
- **Acceptance:**
  - [ ] Слушает `trips.day.ended` (или scheduled job каждые 15 мин для активных trips)
  - [ ] Создаёт `FeedbackRequest` на текущий день
  - [ ] Публикует `feedback.requested`
  - [ ] comm-svc слушает → push клиенту
  - [ ] Дедупликация: один request на (trip, day, day_phase)
- **Files:** `apps/api/src/modules/feedback/request.scheduler.ts`
- **Labels:** `area:feedback`, `slice:G`, `priority:p0`, `type:feat`

## IH-M5-G-003 — feat(feedback): эндпоинты POST/GET feedback

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** G-001
- **Acceptance:**
  - [ ] `POST /feedback` принимает `{tripId, dayNumber, type, body, mood, mediaId?, idempotencyKey}`
  - [ ] Если type=circle — связывает с media-svc
  - [ ] Публикует `feedback.received`
  - [ ] `GET /trips/:id/feedbacks` (client + concierge + manager)
  - [ ] Idempotent
- **Files:** `apps/api/src/modules/feedback/feedback.controller.ts`
- **Labels:** `area:feedback`, `slice:G`, `priority:p0`, `type:feat`

## IH-M5-G-004 — feat(feedback): negative-detection

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** G-003
- **Acceptance:**
  - [ ] Проверка: mood ∈ {😔, 😐} → signal `mood_low`
  - [ ] Простой keyword-detector в `body` (плохо/болею/проблема/возмущён) → signal `keyword_negative`
  - [ ] При наличии любого signal → публикует `feedback.negative.detected`
  - [ ] comm-svc алертит concierge на смене (priority push)
- **Files:** `apps/api/src/modules/feedback/negative-detector.ts`
- **Labels:** `area:feedback`, `slice:G`, `priority:p0`, `type:feat`
- **Notes:** ML-классификатор — фаза 4. Сейчас простые правила достаточны и понятны для отладки.

## IH-M5-G-005 — feat(web): экран фидбэка

- **Type:** feat — **Estimate:** 6h — **Owner:** frontend — **Deps:** G-003, F-007
- **Acceptance:**
  - [ ] `/trips/:id/feedback/:day` экран с двумя кнопками (текст / кружок)
  - [ ] Текст: textarea + 5 emoji-mood
  - [ ] Кружок: redirect to recorder (slice F)
  - [ ] После отправки — toast «отправлено» + возврат на главную
  - [ ] Открывается deep-link из push-уведомления
- **Files:** `apps/web/app/trips/[id]/feedback/[day]/*`
- **Labels:** `area:web`, `slice:G`, `priority:p0`, `type:feat`

## IH-M5-G-006 — feat(feedback): NPS финальный (post-trip)

- **Type:** feat — **Estimate:** 5h — **Owner:** backend — **Deps:** G-003, D-012
- **Acceptance:**
  - [ ] Слушает `trips.completed` → планирует NPS-request на +3 дня
  - [ ] Email + in-app push: «Оцените поездку 0–10 + комментарий»
  - [ ] `Nps` модель (clientId, tripId, score, comment, createdAt)
  - [ ] Публикует `feedback.nps.received`
- **Files:** `apps/api/src/modules/feedback/nps/*`
- **Labels:** `area:feedback`, `slice:G`, `priority:p1`, `type:feat`

## Slice G — итог

6 issues, ≈ 26 часов.

**DoD:** ежедневный фидбэк работает (текст или кружок), negative-detection алертит, NPS post-trip собирается.
