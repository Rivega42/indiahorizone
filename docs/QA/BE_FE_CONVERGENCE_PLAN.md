# План конвергенции BE↔FE — личный кабинет (фаза 3 → MVP launch)

> **Цель.** Перевести 13 US-CAB историй из статуса 🔴/🟡 в 🟢 за счёт **подключения фронта к уже работающим API**, плюс закрыть 6 gap'ов где нужны и BE, и FE (SOS, оплата, квиз, оферта, media finalize, дневник).
>
> **Источник.** [`USER_STORIES_E2E.md`](./USER_STORIES_E2E.md) + матрица готовности из ответа Claude от 2026-05-02.
>
> **Стратегия.** Все задачи группируются под **новый эпик `[EPIC 14] BE↔FE Convergence — клиентский кабинет`**, привязанный к маркеру `phase 3 launch`. Под эпиком — issues; под issues — sub-issues (BE / FE / integration test) согласно [Принципу 8 CLAUDE.md](../../CLAUDE.md#8-иерархия-github-issues--epic--issue--sub-issue).
>
> **Owner:** Roman + Claude (FE/BE), Vика (CI/deploy после merge).
>
> **Версия:** v0.1, 2026-05-02.

---

## Структура иерархии

```
[EPIC 14] BE↔FE Convergence — клиентский кабинет (новый)
├── Track A — FE подключение к готовому BE (13 issues)
│   ├── #A-01  Profile index → /clients/me [US-CAB-01]
│   ├── #A-02  PII edit form [US-CAB-02]
│   ├── #A-03  2FA enrollment UI [US-CAB-08]
│   ├── #A-04  2FA challenge UI (login flow) [US-EXT-14]
│   ├── #A-05  Sessions list + logout-all UI [US-CAB-10]
│   ├── #A-06  Consents management UI [US-CAB-11]
│   ├── #A-07  Emergency contacts UI [US-CAB-12]
│   ├── #A-08  Trips list UI [US-CAB-14]
│   ├── #A-09  Trip card + program UI [US-CAB-15]
│   ├── #A-10  Chat UI (threads + messages) [US-CAB-19, US-CAB-20]
│   ├── #A-11  Daily feedback UI (text+emoji) [US-CAB-22, US-CAB-24]
│   ├── #A-12  Password reset UI [US-EXT-15]
│   └── #A-13  Trip Dashboard «Сейчас/Следующее» [US-CAB-16]
│
└── Track B — BE+FE feature builds (6 issues с предзависимостями)
    ├── #B-01  SOS module — backend [US-CAB-25, US-CAB-26]
    ├── #B-02  Payment integration (ЮKassa) [US-CAB-28]
    ├── #B-03  Offer acceptance [US-CAB-27]
    ├── #B-04  Client quiz/anketa [US-CAB-04]
    ├── #B-05  Media upload finalize (#174-178) [US-CAB-03, US-CAB-23]
    └── #B-06  Trip diary [US-CAB-29, US-CAB-30]
```

---

## Track A — FE подключение к готовому BE

> **Общий формат sub-issue:** `[FE]` подключение, `[BE]` контракт-чек / минор-фиксы, `[E2E]` интеграционный тест.
> **Branch naming:** `claude/fe-convergence-{shortname}`.

### #A-01 — Profile index → /clients/me

**User Story:** US-CAB-01.
**Цель:** На `/profile` шапка показывает имя клиента из API, меню разделов рендерится.

**Acceptance:**
- [ ] При входе без auth → редирект на `/login?from=/profile`.
- [ ] Шапка с именем из `GET /clients/me`.
- [ ] Меню: Личные данные / Уведомления / Безопасность / Поездки / Согласия / Контакты / Выйти.
- [ ] Кнопка «Выйти» вызывает `POST /auth/logout` + чистит token store.

**Sub-issues:**
- `[A-01.1]` `[FE]` Создать `apps/web/lib/api/clients.ts` с `getMe()` хелпером.
- `[A-01.2]` `[FE]` Обновить `apps/web/app/profile/page.tsx`: вызов `useQuery(['me'], getMe)` + рендер шапки + меню.
- `[A-01.3]` `[FE]` Подключить кнопку «Выйти» через `useLogout()` хук.
- `[A-01.4]` `[E2E]` Добавить Playwright-тест: register → /profile → проверить имя в шапке + клик меню.

**Estimate:** 0.5 дня. **Зависит от:** —.

---

### #A-02 — PII edit form

**User Story:** US-CAB-02.
**Цель:** На `/profile/personal` редактировать имя/телефон/DOB/гражданство.

**Acceptance:**
- [ ] Pre-fill из `GET /clients/me`.
- [ ] PII masked с кнопкой «Показать» (с аудит-event'ом).
- [ ] Submit → `PATCH /clients/me` diff-only.
- [ ] Toast «Сохранено» / валидация ошибок.

**Sub-issues:**
- `[A-02.1]` `[FE]` Создать `apps/web/app/profile/personal/page.tsx` + формы (react-hook-form + zod).
- `[A-02.2]` `[FE]` Расширить `lib/api/clients.ts`: `updateMe(diff)`.
- `[A-02.3]` `[FE]` Реализовать masking (`+7 *** *** ** 12`) и toggle через клик «Показать».
- `[A-02.4]` `[BE]` Проверить: `PATCH /clients/me` принимает partial body (zod-схема) и эмитит `clients.profile.updated`.
- `[A-02.5]` `[E2E]` Playwright: edit phone → reload → персистность.

**Estimate:** 1 день. **Зависит от:** A-01.

---

### #A-03 — 2FA enrollment UI

**User Story:** US-CAB-08.
**Цель:** На `/profile/security/2fa` пройти flow QR → код → recovery codes.

**Acceptance:**
- [ ] Шаг 1: `POST /auth/2fa/enroll` → QR + secret.
- [ ] Шаг 2: ввод 6-значного кода → `POST /auth/2fa/verify-enroll` → 10 recovery codes.
- [ ] Шаг 3: показ кодов с download/copy/print + обязательный чекбокс.
- [ ] Аудит: `auth.2fa.enabled`.

**Sub-issues:**
- `[A-03.1]` `[FE]` Создать `apps/web/app/profile/security/2fa/page.tsx` (multi-step wizard).
- `[A-03.2]` `[FE]` Добавить QR-renderer (например, `qrcode.react`) — отрендерить `otpauth://...` URL.
- `[A-03.3]` `[FE]` `lib/api/auth.ts`: добавить `enroll2fa()` и `verify2faEnroll()`.
- `[A-03.4]` `[FE]` Recovery codes UI: copy-all / download .txt / print.
- `[A-03.5]` `[BE]` Проверить, что `verify-enroll` возвращает `recoveryCodes: string[]` ровно 1 раз.
- `[A-03.6]` `[E2E]` Playwright: register → enroll → ввести code из mocked TOTP → проверить, что 2FA active.

**Estimate:** 2 дня. **Зависит от:** A-01.

> **Рекомендация:** проверить, есть ли endpoint `/auth/2fa/disable`. Если нет — добавить sub-issue `[A-03.7] [BE]` (нельзя оставлять клиента без отката).

---

### #A-04 — 2FA challenge UI (login flow)

**User Story:** US-EXT-14.
**Цель:** При входе с включённой 2FA — экран challenge между логином и кабинетом.

**Acceptance:**
- [ ] Если `POST /auth/login` отвечает `requires2FA: true` + `challengeToken` → редирект на `/login/2fa`.
- [ ] Поле для TOTP (6 цифр) + ссылка «Использовать recovery-код».
- [ ] При 3 неверных попытках — sessions invalidated, redirect на `/login`.
- [ ] Аудит: `auth.2fa.verify.success` / `auth.2fa.verify.failed`.

**Sub-issues:**
- `[A-04.1]` `[FE]` Обновить `useLogin()` хук — обрабатывать `requires2FA`.
- `[A-04.2]` `[FE]` Создать `apps/web/app/(auth)/login/2fa/page.tsx`.
- `[A-04.3]` `[FE]` Хранить challengeToken в sessionStorage до verify.
- `[A-04.4]` `[BE]` Проверить, что `POST /auth/login` возвращает структурированный response (success / requires2FA), а не сразу выдаёт токены.
- `[A-04.5]` `[E2E]` Playwright: enroll → logout → login → 2FA prompt → verify.

**Estimate:** 1 день. **Зависит от:** A-03 (нужен enrolled user для теста).

---

### #A-05 — Sessions list + logout-all UI

**User Story:** US-CAB-10.
**Цель:** На `/profile/security/sessions` видеть активные сессии + кнопку «Выйти со всех остальных».

**Acceptance:**
- [ ] Список: device label, IP, дата, last active.
- [ ] Текущая сессия помечена «эта сессия».
- [ ] Кнопка «Выйти со всех остальных» → `POST /auth/logout-all` (исключая текущую).
- [ ] Кнопка «Завершить» по конкретной сессии.

**Sub-issues:**
- `[A-05.1]` `[BE]` **Новый endpoint** `GET /auth/sessions` — список активных Session записей текущего user.
- `[A-05.2]` `[BE]` **Новый endpoint** `DELETE /auth/sessions/:id` — завершение конкретной сессии.
- `[A-05.3]` `[BE]` Добавить парсинг User-Agent → device label (использовать `ua-parser-js`).
- `[A-05.4]` `[FE]` Создать `apps/web/app/profile/security/sessions/page.tsx`.
- `[A-05.5]` `[FE]` `lib/api/auth.ts`: `listSessions()`, `revokeSession(id)`.
- `[A-05.6]` `[E2E]` Тест: 2 браузера → logout-all из первого → второй разлогинен.

**Estimate:** 1.5 дня. **Зависит от:** —.

---

### #A-06 — Consents management UI

**User Story:** US-CAB-11.
**Цель:** На `/profile/consents` управлять 4 типами согласий.

**Acceptance:**
- [ ] 4 toggle: photo_video, geo, emergency_contacts, marketing.
- [ ] Под каждым — текст «зачем» + ссылка на полное согласие.
- [ ] Включение → `POST /clients/me/consents/{type}` с версией.
- [ ] Отключение → `DELETE /clients/me/consents/{type}` + предупреждение «удалится в ≤7 дней».

**Sub-issues:**
- `[A-06.1]` `[FE]` Создать `apps/web/app/profile/consents/page.tsx`.
- `[A-06.2]` `[FE]` `lib/api/consents.ts`: `listConsents()`, `grantConsent(type)`, `revokeConsent(type)`.
- `[A-06.3]` `[FE]` Modal подтверждения отзыва с предупреждением.
- `[A-06.4]` `[BE]` Проверить, что `POST /clients/me/consents/:type` сохраняет `consentVersion` из `lib/legal/versions.ts`.
- `[A-06.5]` `[E2E]` Тест: grant → revoke → история на бэке.

**Estimate:** 1 день. **Зависит от:** A-01.

---

### #A-07 — Emergency contacts UI

**User Story:** US-CAB-12.
**Цель:** На `/profile/emergency` CRUD 1-2 контактов.

**Acceptance:**
- [ ] Список с приоритетом primary/secondary.
- [ ] Форма добавления: имя, телефон (валидация), отношение, язык, регламент.
- [ ] PII шифруются на бэке.
- [ ] При POST — domain event `clients.emergency_contacts.added`.

**Sub-issues:**
- `[A-07.1]` `[FE]` Создать `apps/web/app/profile/emergency/page.tsx`.
- `[A-07.2]` `[FE]` `lib/api/emergency.ts`: `listContacts()`, `upsertContact(data)`, `deleteContact(id)`.
- `[A-07.3]` `[FE]` Validation: телефон в формате E.164.
- `[A-07.4]` `[BE]` Проверить upsert-by-priority: primary вытесняет старого primary.
- `[A-07.5]` `[E2E]` Тест: add → list → delete.

**Estimate:** 1 день. **Зависит от:** A-01.

> **Парк** (вне scope этого issue): SMS-подтверждение контакта (US-CAB-13) — после интеграции SMS-провайдера (#349).

---

### #A-08 — Trips list UI

**User Story:** US-CAB-14.
**Цель:** На `/profile/trips` видеть список поездок.

**Acceptance:**
- [ ] Группировка: Активная / Предстоящие / Прошедшие.
- [ ] Карточка: регион, даты, статус, стоимость.
- [ ] Клик → `/profile/trips/{id}`.
- [ ] Пустое состояние с CTA «Посмотреть туры».

**Sub-issues:**
- `[A-08.1]` `[FE]` Создать `apps/web/app/profile/trips/page.tsx`.
- `[A-08.2]` `[FE]` `lib/api/trips.ts`: `listMyTrips()`.
- `[A-08.3]` `[FE]` Карточка `<TripCard>` с фолд-стилями.
- `[A-08.4]` `[BE]` Проверить, что `GET /trips/me` отдаёт `bookingsCount` + `hasPublishedItinerary`.
- `[A-08.5]` `[E2E]` Тест: создать trip via admin (или seed) → проверить в списке.

**Estimate:** 1 день. **Зависит от:** A-01.

---

### #A-09 — Trip card + program UI

**User Story:** US-CAB-15.
**Цель:** На `/profile/trips/{id}` детали поездки + программа.

**Acceptance:**
- [ ] Hero: регион, даты, статус.
- [ ] Tabs: Программа / Документы / Чат / Фидбэк.
- [ ] Программа: `DayTimeline` из последней published-itinerary.
- [ ] Баннер «отменена» при `status=cancelled`.

**Sub-issues:**
- `[A-09.1]` `[FE]` Создать `apps/web/app/profile/trips/[id]/page.tsx` + tab routing.
- `[A-09.2]` `[FE]` `lib/api/trips.ts`: `getTrip(id)`, `getItinerary(id)`.
- `[A-09.3]` `[FE]` Переиспользовать `<DayTimeline>` из `components/tour/`.
- `[A-09.4]` `[BE]` Проверить `GET /trips/:id/itinerary` — отдаёт latest published, fallback на draft если нет published.
- `[A-09.5]` `[E2E]` Тест: создать trip → publish itinerary → открыть `/profile/trips/{id}` → проверить дни.

**Estimate:** 2 дня. **Зависит от:** A-08.

---

### #A-10 — Chat UI (threads + messages)

**User Story:** US-CAB-19, US-CAB-20.
**Цель:** На `/profile/chat` список threads + история + отправка с idempotency.

**Acceptance:**
- [ ] Список threads с unread badge.
- [ ] История с cursor-based пагинацией + infinity scroll.
- [ ] Send: idempotency-key, pending → solid ✓.
- [ ] Mark read при открытии.

**Sub-issues:**
- `[A-10.1]` `[FE]` Создать `apps/web/app/profile/chat/page.tsx` (список) + `[id]/page.tsx` (thread).
- `[A-10.2]` `[FE]` `lib/api/chat.ts`: `listThreads()`, `listMessages(id, cursor)`, `sendMessage(id, body)`, `markRead(id)`.
- `[A-10.3]` `[FE]` Idempotency-key generation (UUID v4) + retry-handling.
- `[A-10.4]` `[FE]` Polling каждые 10s (Track 1: без WebSocket; WebSocket — отдельный issue в фазе 4).
- `[A-10.5]` `[BE]` Проверить, что unreadCount возвращается в `GET /chat/threads`.
- `[A-10.6]` `[E2E]` Тест: 2 user'а → отправка → mark read.

**Estimate:** 2 дня. **Зависит от:** A-09 (тест в контексте поездки).

> **Note:** US-CAB-21 (realtime через WebSocket) не входит в этот issue — отдельный track в phase 4 (`#TBD`).

---

### #A-11 — Daily feedback UI (text+emoji)

**User Story:** US-CAB-22, US-CAB-24.
**Цель:** Форма текстового фидбэка + список с статусами.

**Acceptance:**
- [ ] Push в 19:00 локального времени → deep link.
- [ ] Форма: 5 emoji + textarea (≤500 chars).
- [ ] Submit с idempotency-key.
- [ ] История по дням с иконками статусов.

**Sub-issues:**
- `[A-11.1]` `[FE]` Создать `apps/web/app/profile/trips/[id]/feedback/page.tsx`.
- `[A-11.2]` `[FE]` `lib/api/feedback.ts`: `createFeedback(tripId, day, payload)`, `listTripFeedbacks(tripId)`.
- `[A-11.3]` `[BE]` Проверить scheduled job `feedback-prompt-19:00` (с timezone из Trip.region).
- `[A-11.4]` `[FE]` Push payload содержит deep link `/profile/trips/{id}/feedback?day={N}`.
- `[A-11.5]` `[E2E]` Тест: создать trip → trigger scheduled job → submit feedback → list.

**Estimate:** 1.5 дня. **Зависит от:** A-09.

> **Парк** (вне scope): видео-кружок US-CAB-23 — зависит от B-05 (media upload finalize).

---

### #A-12 — Password reset UI

**User Story:** US-EXT-15.
**Цель:** Flow forgot-password → email link → reset.

**Acceptance:**
- [ ] `/forgot-password` — форма email + generic-сообщение «если email есть, ссылка отправлена».
- [ ] Email со ссылкой `/reset-password?token=...` (TTL 24h).
- [ ] Форма нового пароля + confirm.
- [ ] При успехе — автологин + `/profile`.
- [ ] При просроченном токене — CTA повторить.

**Sub-issues:**
- `[A-12.1]` `[FE]` Создать `apps/web/app/(auth)/forgot-password/page.tsx`.
- `[A-12.2]` `[FE]` Создать `apps/web/app/(auth)/reset-password/page.tsx` с обработкой `?token=`.
- `[A-12.3]` `[FE]` `lib/auth/api.ts`: `requestPasswordReset(email)`, `confirmPasswordReset(token, password)`.
- `[A-12.4]` `[BE]` Проверить email-template + link-format (требуется email-провайдер из `#349`).
- `[A-12.5]` `[E2E]` Тест: request → читать email из mailhog → click link → reset → login с новым.

**Estimate:** 1 день. **Зависит от:** `#349` (email-провайдер).

---

### #A-13 — Trip Dashboard «Сейчас/Следующее»

**User Story:** US-CAB-16.
**Цель:** Главный экран активной поездки с таймлайном и quick actions.

**Acceptance:**
- [ ] Hero: «День N из M», локация, дата.
- [ ] Карточки СЕЙЧАС / СЛЕДУЮЩЕЕ с таймером.
- [ ] 4 quick actions.
- [ ] Push за 2ч и 30мин до event'а.

**Sub-issues:**
- `[A-13.1]` `[FE]` Создать `apps/web/app/profile/trips/[id]/dashboard/page.tsx`.
- `[A-13.2]` `[FE]` Логика «определить текущий event» по timezone тура.
- `[A-13.3]` `[FE]` Refresh каждые 60s (или WebSocket в фазе 4).
- `[A-13.4]` `[BE]` Scheduled jobs `event-reminder-2h` и `event-reminder-30m` (через `@nestjs/schedule` + push).
- `[A-13.5]` `[E2E]` Тест: создать trip с itinerary → встать на день N → проверить «Сейчас».

**Estimate:** 2 дня. **Зависит от:** A-09.

---

## Track B — BE+FE feature builds

### #B-01 — SOS module (BE + FE)

**User Story:** US-CAB-25, US-CAB-26.
**Цель:** Полная SOS-механика (hold-to-trigger + escalation).
**Связан с:** `#192`, `#19`, EPIC 3.

**Acceptance:**
- [ ] `<SosButton>` floating на всех страницах кабинета.
- [ ] Hold 2 сек → 10s окно отмены → `POST /sos/events`.
- [ ] Auto-escalation: push дежурному → SMS → звонок (по SLA).
- [ ] При SOS открывается чат с concierge.

**Sub-issues:**
- `[B-01.1]` `[BE]` Prisma модели: `SosEvent`, `SosAck`, `SosEscalation`.
- `[B-01.2]` `[BE]` Migration + seeds (test данные).
- `[B-01.3]` `[BE]` `SosController` + `SosService`: `POST /sos/events`, `POST /sos/events/:id/ack`.
- `[B-01.4]` `[BE]` Escalation worker: push → SMS (через `#349`) → звонок (Asterisk?) с timeouts.
- `[B-01.5]` `[BE]` Domain events: `sos.triggered`, `sos.acknowledged`, `sos.escalated`.
- `[B-01.6]` `[FE]` Компонент `<SosButton>` + 10s countdown + cancel.
- `[B-01.7]` `[FE]` `lib/api/sos.ts`: `triggerSos(payload)`.
- `[B-01.8]` `[FE]` Geolocation API integration (с consent check).
- `[B-01.9]` `[E2E]` Полный Playwright + mock'и push/SMS/call.

**Estimate:** 1 неделя. **Зависит от:** A-06 (consents UI — `geo` consent), `#349` (SMS).

---

### #B-02 — Payment integration (ЮKassa)

**User Story:** US-CAB-28.
**Цель:** Оплата тура через ЮKassa.
**Связан с:** `#11`, EPIC 2.

**Acceptance:**
- [ ] Выбор способа: карта, СБП, расчётный счёт.
- [ ] Создание payment intent → redirect на gateway.
- [ ] Webhook на success → `Booking.status = paid`.
- [ ] Email-чек + история в кабинете.

**Sub-issues:**
- `[B-02.1]` `[BE]` Prisma: `Payment` модель + transitions (pending/paid/refunded/failed).
- `[B-02.2]` `[BE]` ЮKassa SDK integration (yookassa-js или REST).
- `[B-02.3]` `[BE]` `POST /trips/:id/payment-intent` + webhook handler `/payments/yookassa/webhook` с сигнатурой проверки.
- `[B-02.4]` `[BE]` Email с чеком (через `#349`).
- `[B-02.5]` `[FE]` `apps/web/app/profile/trips/[id]/payment/page.tsx`.
- `[B-02.6]` `[FE]` `lib/api/payments.ts`: `createPaymentIntent(tripId, method)`.
- `[B-02.7]` `[E2E]` Тест с ЮKassa sandbox.

**Estimate:** 1.5 недели. **Зависит от:** ЮKassa account (founders), `#349`.

> **Рекомендация:** Перед началом — issue для founders «Открыть ЮKassa account и получить test/live credentials» (внешняя зависимость).

---

### #B-03 — Offer acceptance

**User Story:** US-CAB-27.
**Цель:** Подписание оферты через checkbox + SMS/email confirm.
**Связан с:** `#47` (юридика).

**Acceptance:**
- [ ] Полный текст оферты на странице.
- [ ] Checkbox disabled до прокрутки в конец.
- [ ] SMS-код или email-link для confirm.
- [ ] `OfferAcceptance` запись с consentVersion, signedAt, ip, userAgent.

**Sub-issues:**
- `[B-03.1]` `[BE]` Prisma: `OfferAcceptance` модель.
- `[B-03.2]` `[BE]` `POST /trips/:id/offer-acceptance` + verify SMS-code или email-token.
- `[B-03.3]` `[FE]` `apps/web/app/profile/trips/[id]/contract/page.tsx`.
- `[B-03.4]` `[FE]` Scroll-to-bottom detector + checkbox unlock.
- `[B-03.5]` `[E2E]` Полный flow: scroll → check → SMS-code → submit.

**Estimate:** 4 дня. **Зависит от:** `#349` (SMS), оферта от юриста (`#307`).

---

### #B-04 — Client quiz/anketa

**User Story:** US-CAB-04.
**Цель:** Multi-step квиз ≤12 вопросов.

**Acceptance:**
- [ ] Multi-step с прогресс-баром.
- [ ] Auto-save draft на каждом шаге.
- [ ] Pre-fill при повторном открытии.

**Sub-issues:**
- `[B-04.1]` `[BE]` Prisma: расширить `ClientProfile` полями `dietPreferences`, `allergies`, `paceLevel`, `hasChildren`, `indiaExperience`. Migration.
- `[B-04.2]` `[BE]` `GET /clients/me/quiz` + `POST /clients/me/quiz` (с auto-save через `PATCH`).
- `[B-04.3]` `[FE]` `apps/web/app/profile/quiz/page.tsx` (multi-step).
- `[B-04.4]` `[FE]` `lib/api/quiz.ts`: `getQuiz()`, `saveQuizStep(step, data)`.
- `[B-04.5]` `[E2E]` Тест: пройти полный квиз → reload → продолжить.

**Estimate:** 4 дня. **Зависит от:** A-01.

---

### #B-05 — Media upload finalize

**User Story:** US-CAB-03 (документы), US-CAB-23 (видео-кружок).
**Связан с:** `#174`-`#178`.

**Acceptance:**
- [ ] Presigned URL upload в S3.
- [ ] `POST /media/finalize` после upload'а → запись в `MediaAsset`.
- [ ] Обработка статусов: `uploaded` → `transcoding` → `ready` / `failed`.

**Sub-issues:**
- `[B-05.1]` `[BE]` Дореализовать `POST /media/upload-url` (presigned).
- `[B-05.2]` `[BE]` `POST /media/finalize` с проверкой checksum.
- `[B-05.3]` `[BE]` Worker: транскодинг видео через ffmpeg.
- `[B-05.4]` `[BE]` Domain events: `media.uploaded`, `media.transcoded`, `media.failed`.
- `[B-05.5]` `[FE]` `lib/media/upload.ts`: helper для presigned upload + finalize.
- `[B-05.6]` `[FE]` Прогресс-бар + retry queue (offline-first для видео-кружка).
- `[B-05.7]` `[E2E]` Тест: upload PDF → assert ready.

**Estimate:** 1.5 недели. **Зависит от:** S3 credentials (`#350`).

---

### #B-06 — Trip diary (post-completion)

**User Story:** US-CAB-29, US-CAB-30.
**Цель:** Дневник из фото гида + кружков + программы + share-link.
**Связан с:** `#249` (M5.F EPIC).

**Acceptance:**
- [ ] Доступен только при `Trip.status = completed`.
- [ ] Таймлайн: фото гида + кружок клиента + текст программы.
- [ ] Share-link с TTL 90 дней.

**Sub-issues:**
- `[B-06.1]` `[BE]` `GET /trips/:id/diary` — aggregation media + feedback + itinerary.
- `[B-06.2]` `[BE]` `POST /trips/:id/diary/share` — генерация tokenized URL.
- `[B-06.3]` `[BE]` `GET /diary/share/:token` — public read-only endpoint.
- `[B-06.4]` `[FE]` `apps/web/app/profile/trips/[id]/diary/page.tsx`.
- `[B-06.5]` `[FE]` `apps/web/app/diary/[token]/page.tsx` (public).
- `[B-06.6]` `[FE]` Share modal с шаблонами Telegram/WA/email.
- `[B-06.7]` `[E2E]` Тест: complete trip → open diary → share → проверить public link.

**Estimate:** 1 неделя. **Зависит от:** B-05 (media), A-09 (trip card).

---

## Сводная таблица

| Issue | Story | Track | Estimate | Зависит от | Блокеры |
|---|---|---|---|---|---|
| `#A-01` | US-CAB-01 | A | 0.5d | — | — |
| `#A-02` | US-CAB-02 | A | 1d | A-01 | — |
| `#A-03` | US-CAB-08 | A | 2d | A-01 | — |
| `#A-04` | US-EXT-14 | A | 1d | A-03 | — |
| `#A-05` | US-CAB-10 | A | 1.5d | — | — |
| `#A-06` | US-CAB-11 | A | 1d | A-01 | — |
| `#A-07` | US-CAB-12 | A | 1d | A-01 | — |
| `#A-08` | US-CAB-14 | A | 1d | A-01 | — |
| `#A-09` | US-CAB-15 | A | 2d | A-08 | — |
| `#A-10` | US-CAB-19/20 | A | 2d | A-09 | — |
| `#A-11` | US-CAB-22/24 | A | 1.5d | A-09 | — |
| `#A-12` | US-EXT-15 | A | 1d | — | `#349` (email) |
| `#A-13` | US-CAB-16 | A | 2d | A-09 | — |
| `#B-01` | US-CAB-25/26 | B | 1w | A-06 | `#349` (SMS) |
| `#B-02` | US-CAB-28 | B | 1.5w | — | ЮKassa, `#349` |
| `#B-03` | US-CAB-27 | B | 4d | — | `#307`, `#349` |
| `#B-04` | US-CAB-04 | B | 4d | A-01 | — |
| `#B-05` | US-CAB-03/23 | B | 1.5w | — | `#350` (S3) |
| `#B-06` | US-CAB-29/30 | B | 1w | B-05, A-09 | — |

**Track A total:** ~17.5 рабочих дней (≈3.5 недели одним разработчиком, 2 недели если 2 параллельно).
**Track B total:** ~6.5 недель (но зависит от внешних блокеров — ЮKassa/S3/SMS/email).

---

## Рекомендации founders

> **1. Начинать с Track A.** Track A разблокирует ≥10 user stories на коде, уже стоящем в production. Это 3 недели → 50%-я готовность к launch без единого нового микросервиса. Track B блокирован внешними поставщиками.
>
> **2. Track B ждёт внешних поставщиков.** Без ЮKassa account, S3 credentials, SMS-провайдера и юр-ревью оферты — Track B не запустится. Это **issues для founders / Vика**, не для разработчика. См. `BACKLOG.md` блокеры.
>
> **3. WebSocket для чата — не сейчас.** В Track A полинг 10s даёт «достаточно realtime» для phase 3. WebSocket откладываем в phase 4 (избежим лишней инфры на старте).
>
> **4. Видео-кружок — после S3.** US-CAB-23 (B-05) — фича-флагман UGC-механики, но без S3 не запустить. Если S3 затягивается — стоит сделать **Track A.B11 текстовым фидбэком** как fallback (что уже в плане).
>
> **5. Распараллеливание.** Track A организован так, что после `#A-01` можно запустить 4 параллельных потока: `A-02/A-06/A-07` (профиль), `A-03→A-04` (2FA), `A-05` (sessions), `A-08→A-09→A-10/A-11/A-13` (trips). 2 разработчика закроют Track A за 1.5 недели.

---

## Связанные документы

- [`USER_STORIES_E2E.md`](./USER_STORIES_E2E.md) — детали каждой US.
- [`docs/USER_STORIES.md`](../USER_STORIES.md) — продуктовые stories по JTBD.
- [`docs/TZ/MVP_PHASE3.md`](../TZ/MVP_PHASE3.md) — приоритеты фазы 3.
- [`STATE.md`](../../STATE.md) — текущие блокеры и внешние зависимости.
- [`CLAUDE.md`](../../CLAUDE.md) — Принцип 8 (иерархия issues).
