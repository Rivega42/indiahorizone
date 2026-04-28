# Catalog Domain — каталог туров

> **Статус:** v1.0. Закрывает [#311](https://github.com/Rivega42/indiahorizone/issues/311).
> **Owner:** product (Roman) для контента, dev для кода.
> **Связано:** [`MICROSERVICES.md`](./MICROSERVICES.md), [`EVENTS.md`](./EVENTS.md), [`docs/UX/TOUR_LANDING.md`](../UX/TOUR_LANDING.md).

## Назначение

`catalog-svc` — **публичный read-only** домен туров для landing-страниц `/tours/[slug]`. Туры — продаваемые продукты, описания, цены, маршруты по дням. Это витрина; продажа (lead → договор → оплата) идёт через отдельные домены (`leads`, `trips`, `finance`).

> **Принципиальное разделение:**
> - **Catalog** — что мы продаём (template-описание тура)
> - **Trips** — конкретная поездка конкретного клиента, может базироваться на каталог-shape, но создаётся менеджером (manager) индивидуально
>
> Это позволяет: (1) показывать туры в выдаче без trip-state, (2) менять описание тура без затрагивания уже проданных trip'ов, (3) А/B-тестировать landing-страницы.

## Модели данных

### Tour

Главная сущность — описание тура для landing-страницы.

| Поле | Тип | Зачем |
|---|---|---|
| `id` | UUID | PK |
| `slug` | String unique | `/tours/<slug>` URL — РУ-транслит (`tury-kerala-oktyabr-2026`) для SEO Яндекса |
| `status` | TourStatus | `DRAFT` \| `PUBLISHED` (\| `ARCHIVED` будущее) |
| `title` | String | "Керала. 10 дней без хаоса" |
| `region` | String | "Тривандрум · Варкала · Джатаю" — отображается под title |
| `durationDays` | Int | Используется в hero и Schema.org |
| `season` | String | "Октябрь 2026", "Ноябрь — декабрь 2026" — свободный текст |
| `priceFromRub` | Int | Минимум на человека (в рублях, без копеек — фаза 3) |
| `priceToRub` | Int? | Верх диапазона. NULL = только "от X" |
| `groupSize` | String | "до 8 человек" |
| `heroVideoUrl` | String? | mp4/webm для hero-видео (опционально) |
| `heroPosterUrl` | String | poster image для hero (LCP-изображение, обязательно) |
| `emotionalHook` | String | 3-4 строки в hero — главный эмоциональный аргумент |
| `inclusions` | JSONB | `{included: string[], notIncluded: string[]}` |
| `faq` | JSONB | `{q: string, a: string}[]` для FAQ + Schema.org FAQPage |
| `trustBadges` | JSONB | `string[]` — 3 trust-бейджа под hero CTA |
| `facts` | JSONB | `{iconKind, label, value}[]` — 6 быстрых фактов |
| `publishedAt` | DateTime? | когда первый раз опубликован |
| `createdAt`, `updatedAt` | DateTime | timestamps |

### TourDay

Один день тура — описание + фото + активности.

| Поле | Тип | Зачем |
|---|---|---|
| `id` | UUID | PK |
| `tourId` | UUID FK→tours | CASCADE delete |
| `dayNumber` | Int | 1..durationDays, unique в рамках тура |
| `location` | String | "Алаппужа", "Варкала" |
| `title` | String | "Backwaters на houseboat" |
| `description` | String | Markdown допускается |
| `activities` | JSONB | `{kind, label}[]` — типизированный набор `kind`: `culture\|nature\|food\|water\|adventure\|wellness` |
| `imageUrl` | String | Фото дня |
| `isOptional` | Boolean | true = "на выбор" (треккинг ИЛИ СПА) |
| `costInrFrom` | Int? | **INTERNAL** — нижняя граница INR. НЕ отдаётся клиенту через API |
| `costInrTo` | Int? | **INTERNAL** — верхняя граница INR. НЕ отдаётся клиенту через API |

> **Privacy / маржа:** `costInrFrom` / `costInrTo` хранятся для внутренней аналитики маржи (RUB priceFrom / INR cost = gross margin). **Никогда** не попадают в публичный API — `CatalogService.toDayDto()` сознательно их исключает. Это критично потому что Next.js `getStaticProps` встраивает весь response в HTML — утечка маржи через bundle была бы видна любому клиенту.

### TourMedia (опционально, фаза 4)

Дополнительные фото/видео в галерее (не hero, не дневные). Отдельная таблица — чтобы фото можно было переиспользовать между турами и переупорядочивать.

> Сейчас (фаза 3): нет — все фото в `Tour.heroPosterUrl` + `TourDay.imageUrl`.

## API

### `GET /tours` — список published туров

**Public** (без auth). Используется `/tours/[slug]/page.tsx → generateStaticParams()` для pre-render и `/tours` index page (V2).

```http
GET /tours
→ 200 [
  {
    slug: "tury-kerala-oktyabr-2026",
    title: "Керала. 10 дней без хаоса",
    region: "Тривандрум · Варкала · Джатаю",
    durationDays: 10,
    season: "Октябрь 2026",
    priceFromRub: 250000,
    priceToRub: 320000,
    heroPosterUrl: "..."
  },
  ...
]
```

DTO: `TourSummaryDto` — лёгкий, для index/listings. **БЕЗ** `costInr*`, без days, без faq.

### `GET /tours/:slug` — детали тура

**Public**. Используется landing-страницей.

```http
GET /tours/tury-kerala-oktyabr-2026
→ 200 {
  ...TourSummaryDto,
  groupSize, heroVideoUrl, emotionalHook,
  trustBadges, facts, inclusions, faq,
  days: [{dayNumber, location, title, description, activities, imageUrl, isOptional}, ...]
}
→ 404 если slug не найден или status !== PUBLISHED
```

DTO: `TourDetailsDto extends TourSummaryDto`. **БЕЗ** `costInrFrom` / `costInrTo` в днях.

### Будущее (V2)

- `POST /admin/tours` — admin создаёт тур
- `PATCH /admin/tours/:id` — admin редактирует
- `POST /admin/tours/:id/publish` — переход DRAFT → PUBLISHED
- `GET /admin/tours/:id/preview` — admin видит DRAFT с includes/excludes маржей

## События

Catalog публикует через outbox:

| Type | Когда | Payload | Status |
|---|---|---|---|
| `catalog.tour.published` | DRAFT → PUBLISHED | `{tourId, slug, publishedAt, by}` | ⏳ V2 |
| `catalog.tour.updated` | Published тур изменён | `{tourId, slug, version, changedFields[]}` | ⏳ V2 |
| `catalog.tour.archived` | PUBLISHED → ARCHIVED | `{tourId, reason}` | ⏳ V2 |

**Сейчас** (read-only фаза): catalog не публикует события — туры создаются через seed, изменения через миграции seed-данных.

## Подписчики событий

Catalog подписан на:
- ничего (read-only домен — не реагирует на бизнес-события)

## Cross-domain refs

- `Trip.referenceTourId` — soft-reference на `Tour.id` (если trip создаётся как booking конкретного каталог-тура). NULL = custom trip без ссылки на каталог. Cross-module rule: НЕТ FK.

## Контент-pipeline

### Фаза 3: seed-driven

Туры заводятся через `apps/api/prisma/seed/tours/<slug>.json`:

```json
{
  "slug": "tury-kerala-oktyabr-2026",
  "title": "Керала. 10 дней без хаоса",
  ...
  "days": [
    {"dayNumber": 1, "location": "Тривандрум", ...},
    ...
  ]
}
```

`pnpm --filter @indiahorizone/api db:seed:tours` импортирует / обновляет (upsert по slug). Это безопасно — id'ы стабильны при повторных запусках.

> **Рекомендация для founders:** при добавлении нового тура — сначала JSON в репозитории, code-review, потом merge. **Почему:** контент тура = маркетинговый продукт + Schema.org SEO + юр.значимая информация (цена, состав услуг). Прямое редактирование в БД (PATCH через psql) опасно — нет audit log, нет диффа, нет review.

### Фаза 4: admin UI

`/admin/tours` panel для menedger / admin role. Markdown editor + image upload в S3. Версионирование как в `Itinerary` (#151) — каждое publish создаёт snapshot.

## Frontend интеграция

### `apps/web/lib/api/tours.ts`

Read-through cache:
1. `fetch(API_URL/tours/:slug)` с timeout 3s + Next ISR `revalidate: 3600`
2. На любую ошибку (network / 4xx / 5xx) → fallback на `apps/web/lib/mock/tours.ts`

> **Зачем fallback:** позволяет билдить и деплоить frontend независимо от backend (build-time `generateStaticParams` не зависает если API недоступен). Удалится когда backend стабильно живёт в production. См. также `EPIC 12.5` (#298).

### Компоненты на странице

См. [`docs/UX/TOUR_LANDING.md`](../UX/TOUR_LANDING.md) для шаблона. Кратко:

- Hero (full-screen, priority Image)
- Facts (6 quick facts с иконками)
- DayTimeline (accordion по дням)
- Inclusions (включено / не включено)
- Reviews (пока пусто, появится после первых поездок)
- PriceBlock (CTA + LeadForm)
- FAQ (accordion + Schema.org FAQPage)
- FooterLegal

## SEO

Catalog tour pages — основной органический канал. Подробности в [`TOUR_LANDING.md`](../UX/TOUR_LANDING.md). Кратко:

- Schema.org **TouristTrip** для тура целиком + **TouristAttraction** для каждого дня
- Schema.org **FAQPage** отдельным JSON-LD
- Open Graph (locale=ru_RU, type=website) для Telegram/VK preview
- Twitter Card summary_large_image
- Yandex-verification meta из env
- canonical URL абсолютный
- ISR `revalidate=3600` — sitemap.xml и pre-render обновляются раз в час

## Ограничения / TODO

- **Нет admin UI** — туры пока только через JSON seed (V2: #311 admin panel)
- **Нет тур-изменения "сезон" через API** — нужно создавать новый slug при смене сезона ('tury-kerala-noyabr-2026'). Old slug остаётся для honoring уже проданных trip'ов.
- **Нет multi-language** — только ru. en появится при выходе на en-аудиторию (фаза 4)
- **Нет dynamic pricing** — priceFromRub статичный. Динамическое ценообразование (по сезону / спросу / промокодам) — отдельный issue фазы 4
