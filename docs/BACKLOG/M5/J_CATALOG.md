# Slice J — Catalog (гиды + поставщики) + панель гида

> Goal: «Гид зарегистрирован, видит свою смену и клиентов, может загружать фото и расходы. Менеджер видит каталог гидов с рейтингом».
> Покрывает [`USER_STORIES.md` US-GD-1, US-GD-2, US-GD-3](../../USER_STORIES.md), [`docs/OPS/GUIDE_ONBOARDING.md`](../../OPS/GUIDE_ONBOARDING.md), [`GUIDE_CHECKLISTS.md`](../../OPS/GUIDE_CHECKLISTS.md).

## IH-M5-J-001 — feat(catalog): модели Guide + Hotel + Activity

- **Type:** feat — **Estimate:** 5h — **Owner:** backend — **Deps:** B-001
- **Acceptance:**
  - [ ] `Guide` (id, userId, fullName, regions[], categories enum: trainee|junior|senior|lead, status: pending|active|suspended, languagesJson, rating, ratingBasedOn, contractInfoJson, createdAt)
  - [ ] `Hotel` (id, name, region, address, contact, partnerStatus, rating)
  - [ ] `Activity` (id, name, theme, region, durationHours, partnerId nullable)
  - [ ] `Partner` (id, name, type: hotel_chain|transport|guide_agency, contractStatus)
- **Files:** `apps/api/src/modules/catalog/*`, миграция
- **Labels:** `area:catalog`, `slice:J`, `priority:p0`, `type:feat`

## IH-M5-J-002 — feat(catalog): CRUD endpoints для admin

- **Type:** feat — **Estimate:** 5h — **Owner:** backend — **Deps:** J-001
- **Acceptance:**
  - [ ] `GET/POST/PATCH /catalog/guides` (admin)
  - [ ] `GET/POST/PATCH /catalog/hotels` (admin)
  - [ ] `GET/POST/PATCH /catalog/activities` (admin)
  - [ ] Filtering: region, category, active
  - [ ] При активации гида → `catalog.guide.activated`
- **Files:** `apps/api/src/modules/catalog/catalog.controller.ts`
- **Labels:** `area:catalog`, `slice:J`, `priority:p0`, `type:feat`

## IH-M5-J-003 — feat(catalog): связь Trip → Guide assignment

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** J-001, D-001
- **Acceptance:**
  - [ ] `TripGuideAssignment` (id, tripId, guideId, fromDay, toDay, role: primary|support)
  - [ ] `POST /trips/:id/guides` (manager)
  - [ ] Гид видит свои assignments через `GET /guides/me/assignments`
  - [ ] Конфликт-чек: один primary гид × один регион × один день
- **Files:** `apps/api/src/modules/catalog/assignment.service.ts`
- **Labels:** `area:catalog`, `slice:J`, `priority:p0`, `type:feat`

## IH-M5-J-004 — feat(catalog): rating update on feedback

- **Type:** feat — **Estimate:** 3h — **Owner:** backend — **Deps:** G-006, J-001
- **Acceptance:**
  - [ ] Слушает `feedback.nps.received` и `feedback.received`
  - [ ] Обновляет `rating` гида (rolling 90-day average) при наличии назначения на трип
  - [ ] Публикует `catalog.guide.rating.updated`
- **Files:** `apps/api/src/modules/catalog/rating.service.ts`
- **Labels:** `area:catalog`, `slice:J`, `priority:p1`, `type:feat`

## IH-M5-J-005 — feat(web): панель гида — смена и клиенты

- **Type:** feat — **Estimate:** 8h — **Owner:** frontend — **Deps:** J-003, D-005
- **Acceptance:**
  - [ ] `/guide/today` — программа дня + клиенты + контакты
  - [ ] Карточка клиента: имя, диета, аллергии, темп, особые заметки от менеджера
  - [ ] Push при изменении программы (через `trips.itinerary.updated`)
  - [ ] Деталь клиента — read-only, без доступа к ПДн (паспорт)
- **Files:** `apps/web/app/guide/*`
- **Labels:** `area:web`, `slice:J`, `priority:p0`, `type:feat`

## IH-M5-J-006 — feat(web): загрузка фото гидом в альбом клиента

- **Type:** feat — **Estimate:** 6h — **Owner:** frontend — **Deps:** F-002, J-005
- **Acceptance:**
  - [ ] Из `/guide/today` гид выбирает множественно фото из системной галереи
  - [ ] Привязка к клиенту/дню
  - [ ] Загрузка в фоне (background-sync), retry при плохом интернете
  - [ ] Прогресс-бар на каждое фото
  - [ ] Гид видит «загружено / в очереди / failed»
- **Files:** `apps/web/components/guide/photo-uploader/*`
- **Labels:** `area:web`, `slice:J`, `priority:p0`, `type:feat`

## IH-M5-J-007 — feat(web): учёт расходов гида

- **Type:** feat — **Estimate:** 5h — **Owner:** frontend — **Deps:** J-005, F-002
- **Acceptance:**
  - [ ] `/guide/today/expenses` — фото чека + категория (trans/food/entry/other) + сумма + клиент
  - [ ] Списком все расходы дня
  - [ ] Финансист видит в админке `/admin/expenses`
  - [ ] Сумма дня видна гиду
- **Files:** `apps/web/app/guide/expenses/*`
- **Labels:** `area:web`, `slice:J`, `priority:p1`, `type:feat`

## Slice J — итог

7 issues, ≈ 36 часов.

**DoD:** каталог гидов и поставщиков, гид видит смену, загружает фото и расходы, рейтинг обновляется по фидбэку.
