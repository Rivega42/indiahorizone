# Slice D — Trips + Trip Dashboard ядро (offline)

> Goal: «Клиент видит свои поездки, программу дня (Сейчас/Следующее), документы доступны офлайн, push за 2ч и 30мин до события».
> Покрывает [`USER_STORIES.md` US-CL-4, US-CL-5](../../USER_STORIES.md), [`docs/UX/FEATURES/CORE.md`](../../UX/FEATURES/CORE.md), [`ARCH/OFFLINE.md`](../../ARCH/OFFLINE.md).

## IH-M5-D-001 — feat(trips): модель Trip + Itinerary + DayPlan

- **Type:** feat — **Estimate:** 5h — **Owner:** backend — **Deps:** C-001
- **Acceptance:**
  - [ ] `Trip` (id, clientId, status, startsAt, endsAt, region, totalAmount, currency, createdBy)
  - [ ] `Itinerary` (id, tripId, version, publishedAt)
  - [ ] `DayPlan` (id, itineraryId, dayNumber, date, summary, items JSONB)
  - [ ] `Booking` (id, tripId, type enum: hotel|transfer|activity|guide, vendorId, status, payload JSONB)
  - [ ] Status enum: `draft|paid|in_progress|completed|cancelled`
- **Files:** `apps/api/prisma/schema.prisma`
- **Labels:** `area:trips`, `slice:D`, `priority:p0`, `type:feat`

## IH-M5-D-002 — feat(trips): создание поездки (sales)

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** D-001
- **Acceptance:**
  - [ ] `POST /trips` — только `manager|admin`
  - [ ] Создаёт Trip в статусе `draft`, публикует `trips.created`
  - [ ] Валидация: `endsAt > startsAt`, `clientId` существует
  - [ ] Возвращает `tripId`
- **Files:** `apps/api/src/modules/trips/trips.controller.ts`
- **Labels:** `area:trips`, `slice:D`, `priority:p0`, `type:feat`

## IH-M5-D-003 — feat(trips): редактор маршрута (новая версия itinerary)

- **Type:** feat — **Estimate:** 6h — **Owner:** backend — **Deps:** D-001
- **Acceptance:**
  - [ ] `PATCH /trips/:id/itinerary` создаёт **новую** версию (не редактирует старую)
  - [ ] Только последняя `publishedAt` доступна клиенту через GET
  - [ ] При публикации новой версии — `trips.itinerary.updated` с массивом dayPlanIds
  - [ ] Аудит включает diff
- **Files:** `apps/api/src/modules/trips/itinerary.service.ts`
- **Labels:** `area:trips`, `slice:D`, `priority:p0`, `type:feat`
- **Notes:** Версионирование itinerary критично — клиент мог закешировать старую, нужна история и diff.

## IH-M5-D-004 — feat(trips): /trips/:id/today (Сейчас + Следующее)

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** D-001
- **Acceptance:**
  - [ ] `GET /trips/:id/today?clientLocalTime=...` возвращает `{ now, next, restOfDay }`
  - [ ] Логика: «сейчас» = текущая item по времени; «next» = ближайший по startTime; `restOfDay` = массив до полуночи
  - [ ] Учитывает локальное время клиента (IST для Индии)
  - [ ] Cache: `Cache-Control: max-age=300` (5 мин)
- **Files:** `apps/api/src/modules/trips/today.service.ts`
- **Labels:** `area:trips`, `slice:D`, `priority:p0`, `type:feat`

## IH-M5-D-005 — feat(trips): /trips/:id/documents

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** D-001, F-001
- **Acceptance:**
  - [ ] `GET /trips/:id/documents` возвращает массив `{id, kind, name, mediaId, signedUrl, expiresAt}`
  - [ ] Kind enum: `passport|visa|ticket|insurance|hotel_voucher|programme|other`
  - [ ] Доступ: client (свой), manager, concierge на смене
  - [ ] `POST /trips/:id/documents` привязывает media к поездке (только manager+)
- **Files:** `apps/api/src/modules/trips/documents.service.ts`
- **Labels:** `area:trips`, `slice:D`, `priority:p0`, `type:feat`

## IH-M5-D-006 — feat(web): Trip Dashboard главный экран

- **Type:** feat — **Estimate:** 8h — **Owner:** frontend — **Deps:** D-004, D-005
- **Acceptance:**
  - [ ] `/trips/:id` главный экран по wireframe из [`UX/FEATURES/CORE.md`](../../UX/FEATURES/CORE.md)
  - [ ] «Сейчас» + «Следующее» + countdown
  - [ ] Quick-actions: Документы, Маршрут, Concierge, Гид
  - [ ] Кнопка SOS placeholder (полноценная — slice H)
  - [ ] Адаптивный mobile-first
- **Files:** `apps/web/app/trips/[id]/page.tsx`
- **Labels:** `area:web`, `slice:D`, `priority:p0`, `type:feat`

## IH-M5-D-007 — feat(web): экран документов

- **Type:** feat — **Estimate:** 5h — **Owner:** frontend — **Deps:** D-005, D-009
- **Acceptance:**
  - [ ] `/trips/:id/documents` список с превью
  - [ ] Тап → fullscreen viewer (PDF.js или native viewer)
  - [ ] Кнопка «поделиться» (Web Share API)
  - [ ] Индикатор «офлайн, использую кеш от <время>»
- **Files:** `apps/web/app/trips/[id]/documents/*`
- **Labels:** `area:web`, `slice:D`, `priority:p0`, `type:feat`

## IH-M5-D-008 — feat(web): экран маршрута

- **Type:** feat — **Estimate:** 6h — **Owner:** frontend — **Deps:** D-003
- **Acceptance:**
  - [ ] `/trips/:id/itinerary` день за днём
  - [ ] Каждый день expandable, со списком item (время, заголовок, адрес, контакт, заметка)
  - [ ] Прогресс «вы прошли 3/12 дней»
  - [ ] Поделиться отдельным днём
- **Files:** `apps/web/app/trips/[id]/itinerary/*`
- **Labels:** `area:web`, `slice:D`, `priority:p0`, `type:feat`

## IH-M5-D-009 — feat(web): offline cache (IndexedDB через Dexie)

- **Type:** feat — **Estimate:** 8h — **Owner:** frontend — **Deps:** A-012, D-006
- **Acceptance:**
  - [ ] Dexie схема: `trips`, `day_plans`, `documents`, `documents_blobs`
  - [ ] React Query persistor → IndexedDB
  - [ ] При первом fetch — параллельная загрузка PDF в `documents_blobs` (с прогрессом)
  - [ ] При офлайн — read из cache + индикатор
  - [ ] При reconnect — refetch активных queries
- **Files:** `apps/web/lib/offline/*`
- **Labels:** `area:web`, `slice:D`, `priority:p0`, `type:feat`
- **Notes:** Соответствует [`ARCH/OFFLINE.md`](../../ARCH/OFFLINE.md). Шифрование IndexedDB — отдельный issue K-005.

## IH-M5-D-010 — feat(web): Mapbox offline region download

- **Type:** feat — **Estimate:** 8h — **Owner:** frontend — **Deps:** A-012
- **Acceptance:**
  - [ ] Mapbox GL JS + offline plugin
  - [ ] За 7 дней до старта — UI «скачать карту региона (~250 МБ) в Wi-Fi»
  - [ ] Кнопка не активна на cellular (Network Information API)
  - [ ] Прогресс-бар, возможность отменить
  - [ ] Карта работает в airplane mode после загрузки
- **Files:** `apps/web/components/map/*`
- **Labels:** `area:web`, `slice:D`, `priority:p1`, `type:feat`

## IH-M5-D-011 — feat(comm): push за 2ч и 30мин до события (через trips.day.started)

- **Type:** feat — **Estimate:** 5h — **Owner:** backend — **Deps:** D-001, E-002
- **Acceptance:**
  - [ ] Scheduled job (каждые 5 мин) ищет item с startTime - 120m / -30m в активных trip
  - [ ] Публикует `trips.notification.due` через outbox
  - [ ] comm-svc слушает и шлёт push с template
  - [ ] Idempotency: один item × один тип notification = один push
- **Files:** `apps/api/src/modules/trips/notification.scheduler.ts`
- **Labels:** `area:trips`, `slice:D`, `priority:p0`, `type:feat`

## IH-M5-D-012 — feat(trips): trip status transitions + автоматика

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** D-001
- **Acceptance:**
  - [ ] Слушает `finance.payment.received` → `draft → paid`
  - [ ] При `startsAt <= now` и `status=paid` → `paid → in_progress`
  - [ ] При `endsAt < now` и `status=in_progress` → `in_progress → completed`
  - [ ] Состояние-машина с явной валидацией переходов
  - [ ] Публикует `trips.status.changed` на каждом переходе
- **Files:** `apps/api/src/modules/trips/status-machine.ts`
- **Labels:** `area:trips`, `slice:D`, `priority:p0`, `type:feat`

## IH-M5-D-013 — test(trips): e2e Trip Dashboard ядро

- **Type:** test — **Estimate:** 6h — **Owner:** qa — **Deps:** D-009, D-013
- **Acceptance:**
  - [ ] Создание trip → клиент видит на /trips
  - [ ] Открытие в airplane mode после первого онлайн-визита → данные из кеша
  - [ ] Сейчас/Следующее обновляется при смене времени (mock)
  - [ ] Push симулируется и приходит за 2ч до события
- **Files:** `apps/web/tests/trips.spec.ts`
- **Labels:** `area:trips`, `slice:D`, `priority:p0`, `type:test`

## Slice D — итог

13 issues, ≈ 73 часа (≈ 2 недели).

**DoD:** клиент видит активную поездку с программой, документы офлайн, push-напоминания, статусы автоматически.
