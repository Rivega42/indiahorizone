# Tour Seed — добавление нового тура

> Source-of-truth для каталога туров до появления Admin UI (#311 V2).
> Каждый JSON в этой директории = один тур на `/tours/<slug>`.

## TL;DR — как добавить новый тур

1. **Скопировать** существующий шаблон: `cp kerala-2026-10.json goa-2027-01.json`
2. **Отредактировать** все поля (см. ниже)
3. **Применить:** `pnpm --filter @indiahorizone/api db:seed:tours`
4. **Проверить:** `http://localhost:3010/tours/<your-slug>` рендерится

Auto-discovery: seed-скрипт сам найдёт все `*.json` в этой директории — менять код не надо.

## Структура файла (TourJson)

```jsonc
{
  "slug": "tury-goa-yanvar-2027",          // URL: /tours/<slug>
  "status": "DRAFT",                        // DRAFT (скрыто) / PUBLISHED (публично)
  "title": "Гоа. 7 дней без хаоса",
  "region": "Анджуна · Палолем · форт Чапора",
  "durationDays": 7,
  "season": "Январь 2027",
  "priceFromRub": 180000,                   // INT, в рублях, без копеек
  "priceToRub": 240000,                     // optional — диапазон
  "groupSize": "до 10 человек",
  "heroVideoUrl": null,                     // optional
  "heroPosterUrl": "https://...",
  "emotionalHook": "Океан, форты, прогулки на джипе через джунгли — Индия в её солнечном изводе.",
  "trustBadges": ["24/7 на связи", "Местная команда", "Без скрытых платежей"],
  "facts": [
    { "iconKind": "clock", "label": "Длительность", "value": "7 дней" },
    { "iconKind": "users", "label": "Размер группы", "value": "до 10 человек" },
    { "iconKind": "calendar", "label": "Сезон", "value": "Январь 2027" },
    { "iconKind": "bed", "label": "Отели", "value": "3-4★ у океана" },
    { "iconKind": "car", "label": "Транспорт", "value": "Все трансферы" },
    { "iconKind": "headset", "label": "Поддержка", "value": "24/7 чат" }
  ],
  "inclusions": {
    "included": [
      "Все наземные трансферы",
      "Размещение 3-4★",
      "Гид-сопровождение",
      "Завтраки",
      "Программа 7 дней"
    ],
    "notIncluded": [
      "Авиабилеты",
      "Виза в Индию",
      "Личные расходы",
      "Алкоголь"
    ]
  },
  "faq": [
    {
      "q": "Какая виза нужна?",
      "a": "Электронная e-Visa на 30 дней, оформляется онлайн за 3-7 дней. Помогаем с заявкой."
    }
    // ... 5-10 вопросов
  ],
  "days": [
    {
      "dayNumber": 1,
      "location": "Анджуна",
      "title": "Прилёт. Океан и адаптация.",
      "description": "Встреча в аэропорту Даболим. Трансфер в отель у океана...",
      "activities": [
        { "kind": "culture", "label": "Welcome dinner" },
        { "kind": "water", "label": "Закат у моря" }
      ],
      "imageUrl": "https://...",
      "isOptional": false,                  // true = «на выбор» (треккинг ИЛИ СПА)
      "costInrFrom": 8500,                  // INTERNAL — НЕ показывается клиенту
      "costInrTo": 12000                    // INTERNAL — для аналитики маржи
    }
    // ... durationDays штук
  ]
}
```

## Поля и enum'ы

### `iconKind` (для facts) — иконки Lucide

| Значение | Что |
|---|---|
| `clock` | Часы (длительность) |
| `users` | Люди (размер группы) |
| `calendar` | Календарь (сезон/даты) |
| `bed` | Кровать (отели/проживание) |
| `car` | Машина (транспорт/трансферы) |
| `headset` | Гарнитура (поддержка/чат) |

Расширение enum'а — добавить запись в `apps/web/components/tour/Facts.tsx → ICON_MAP`.

### `activities[].kind` — типы активностей дня

| Значение | Иконка | Применение |
|---|---|---|
| `culture` | 🎵 Music | Храмы, концерты, рынки, культурные программы |
| `nature` | 🌿 Leaf | Природа, парки, водопады, прогулки |
| `food` | 🍴 UtensilsCrossed | Гастро-туры, кулинарные классы |
| `water` | 🌊 Waves | Море, бэкуотеры, лодки, пляжи |
| `adventure` | ⛰ Mountain | Треккинг, рафтинг, экстрим |
| `wellness` | ✨ Sparkles | СПА, йога, аюрведа, ретрит |

### `status`

- `DRAFT` — тур виден в БД но НЕ отдаётся через `GET /tours` и `GET /tours/:slug` (404). Для подготовки контента до публикации.
- `PUBLISHED` — публично доступен. `publishedAt` ставится автоматически в момент перехода в PUBLISHED.

## Slug-конвенция

> **Critical для SEO:** slug = РУ-транслит + сезон. Короткий, ключи в начале.

Хорошо:
- `tury-kerala-oktyabr-2026`
- `tury-goa-yanvar-2027`
- `treking-gimalai-aprel-2026`

Плохо:
- `kerala-10-days-trivandrum-varkala-jatayu` — длинный, Яндекс обрежет
- `tour123` — нет ключей, killing CTR
- `Гоа-январь-2027` — Cyrillic в URL не удобен в копи-пасте

> **Почему важно:** Яндекс показывает первые 50 chars slug'а в snippet'е. Длинный slug → урезанный snippet → -15-20% CTR.

## Privacy: `costInrFrom` / `costInrTo`

Эти поля — **internal**. Хранятся для аналитики маржи (RUB price - INR cost = gross margin). **НЕ отдаются** клиенту через `GET /tours/:slug` — `CatalogService.toDayDto()` сознательно их исключает.

> **Critical:** не публиковать INR-цены в `description` или другие public fields! Next.js getStaticProps встраивает весь response в HTML — если попадёт в DTO, будет видно любому клиенту в DevTools.

## emotional_hook — главное про SEO

Это короткое (2-3 предложения) описание тура, которое:
- Используется как `<meta name="description">` (Yandex/Google snippet)
- Встраивается в Open Graph для Telegram preview
- Попадает в Schema.org TouristTrip

> **Recommendation:** делайте **уникальный** hook для каждого тура. Yandex понижает ranking страниц с дублированием meta-descriptions внутри одного домена (penalty за «доорвейные страницы»). С 10-15 турами это критично.

Хорошо:
- «Керала: 10 дней без хаоса. Программа продумана за вас, контакт с местной командой 24/7. Океан, кокосы, аюрведа.»
- «Гоа в январе: солнце 32°, океан 27°, форты португальских колоний и закатные пляжи Палолема.»

Плохо:
- «Тур в Индию на 10 дней» (generic, скопировано во все туры)
- «Лучший тур!» (no info, спам-сигнал)

## Изображения

### `heroPosterUrl` (обязательно)

Hero-картинка landing-страницы. **LCP-image** = Largest Contentful Paint:

- **Размер:** 1920×1080 (16:9) минимум, **JPEG quality 85** (или WebP)
- **Вес:** ≤ 200kb (Next.js auto-converts в AVIF/WebP, но base тоже важен)
- **Содержание:** атмосферное фото места, не reception desk

> **Important:** домен изображения должен быть в `apps/web/next.config.mjs → images.remotePatterns`. Сейчас разрешены: `images.unsplash.com`, `s3.ru1.storage.beget.cloud` (наш S3 #350), `cdn.indiahorizone.ru`.

### `days[].imageUrl` (обязательно для каждого дня)

Фото локации дня. Lazy-loaded, `aspect-[16/9]`. Можно использовать одно фото на несколько дней (например, для дней в одной локации) — главное чтобы было.

## Контент-tone (recommendation)

> **Recommendation для founders:** избегайте маркетингового пафоса. Русскоязычная travel-аудитория high BS-detector — «лучший тур мечты ✨» читается как реклама и снижает trust.
>
> **Что работает:**
> - Честность с конкретикой («Индия — это шумно. Программа собрана так, чтобы шум был дозированно — храмы балансируем backwaters, рынки — пляжем»)
> - Деталь которая показывает что вы реально были там («жара 32° в обед, поэтому экскурсии до 11:00 и после 16:00»)
> - Эмоция через образ, не прилагательное («розовый закат над озером Веллаянил» лучше чем «прекрасные виды»)

## После добавления тура — checklist

См. также `docs/UX/TOUR_LANDING.md § Тестирование per-tour` для полного списка. Кратко:

- [ ] `pnpm dev:web` → `http://localhost:3010/tours/<slug>` — рендерится без 404
- [ ] Mobile viewport 375px — все секции читаемы
- [ ] [Schema.org валидатор Yandex](https://yandex.ru/dev/json-ld/) — TouristTrip + FAQPage = valid
- [ ] [Google Rich Results Test](https://search.google.com/test/rich-results) — same
- [ ] Telegram debugger — отправить ссылку → preview корректный
- [ ] Lighthouse mobile — Performance ≥ 80, SEO ≥ 95, A11y ≥ 95

## Команды

```bash
# Запустить seed (применит все *.json в этой директории)
pnpm --filter @indiahorizone/api db:seed:tours

# Smoke API
curl http://localhost:4000/tours
curl http://localhost:4000/tours/<slug>

# Локально посмотреть рендер (api + web должны быть запущены)
open http://localhost:3010/tours/<slug>
```

## Идемпотентность

Seed безопасно перезапускать любое количество раз:
- Туры — upsert по `slug`
- Дни — upsert по `(tourId, dayNumber)`
- Удалённые из JSON дни **НЕ** удаляются автоматически из БД (защита от случайного truncate). Удалить день → через psql или admin UI (V2).

## Будущее (#311 V2)

Когда появится Admin Panel:
- Туры будут редактироваться через UI, без re-deploy
- JSON-файлы можно будет удалить (сейчас они source-of-truth)
- Versioning туров — как в `Itinerary` (snapshot на каждый publish)
