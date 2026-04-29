# Tour Landing — UX-шаблон страницы тура

> **Статус:** v1.0. Закрывает [#310](https://github.com/Rivega42/indiahorizone/issues/310).
> **Owner:** product (Roman) + дизайн (Claude Design / external).
> **Связано:** [`docs/ARCH/CATALOG.md`](../ARCH/CATALOG.md), [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).
> **Реализация:** `apps/web/app/tours/[slug]/page.tsx`. Дизайн-итерации: #312–#318.

## Назначение

Шаблон landing-страницы для одного тура. **На запуске — 10–15 туров** (Керала, Гоа, Раджастан, Гималаи, ...). Один template рендерит все туры через данные из catalog API (см. [`CATALOG.md`](../ARCH/CATALOG.md)).

Цель страницы:
- **Конверсия:** посетитель → лид (форма заявки) или → Telegram-сообщение
- **SEO:** ranking в Яндекс/Google по запросам "туры в кералу", "тур в индию октябрь"
- **Trust:** показать профессионализм через продуманность контента (день за днём, что включено, FAQ)

## Анти-цели

- ~~Подробное описание каждого отеля~~ — это уровень trip dashboard, не landing
- ~~Каталог поставщиков / гидов~~ — нет в фазе 3, нет даже в фазе 4
- ~~Online-checkout~~ — нет, продажа идёт через менеджера после лида (фаза 3)

## Структура (top-down)

Страница вертикально. На mobile (приоритет — RU mobile-аудитория) каждая секция занимает ≥ 1 viewport.

### 1. Hero (full-viewport)

```
┌────────────────────────────────────────┐
│ [season pill: "Октябрь 2026"]          │
│                                        │
│ ████ HERO POSTER (next/image priority) │
│ ████                                   │
│ ████   "Керала.                        │
│ ████   10 дней без хаоса"  (h1, serif) │
│ ████                                   │
│ ████   Тривандрум · Варкала · Джатаю   │
│ ████                                   │
│ ████   <emotional_hook 3-4 строки>     │
│ ████                                   │
│ ████   [CTA: Хочу этот тур →]          │
│ ████   [Ghost: Программа по дням]      │
│ ████                                   │
│ ████   • trust badge 1                 │
│ ████   • trust badge 2                 │
│ ████   • trust badge 3                 │
└────────────────────────────────────────┘
                      ┌─────────────────┐
                      │ Стоимость       │
                      │ от 250 000 ₽    │
                      │ на человека     │
                      └─────────────────┘
                      (sticky на desktop)
```

**Ключевые KPI:**
- LCP ≤ 2.5s — hero poster через `<Image fill priority>` (#309)
- CTA viewable выше fold'а на 360px viewport
- Title и hook читабельны на любом фоне (gradient overlay)

> **Рекомендация по контенту:** `emotional_hook` — 1–2 предложения, отвечающие на вопрос «зачем мне этот тур?», не «что в нём». Вместо «10 дней по программе с гидом» → «Индия, в которой не теряются — ни в храмах, ни в чате с местными». **Почему:** на landing'е первые 3 секунды решают, читает ли user дальше. Описание программы клиент увидит ниже.

### 2. Facts (быстрые факты)

```
┌──────────────────────────────────────────────────┐
│ [⏰ 10 дней]  [👥 до 8 чел]  [📅 окт 2026]       │
│ [🛏 3-4★ отели]  [🚗 трансферы]  [🎧 24/7 чат]   │
└──────────────────────────────────────────────────┘
```

6 quick facts с иконками (Lucide). На mobile — 2×3, на desktop — 1×6.

**iconKind enum:** `clock | users | calendar | bed | car | headset` — расширяемо при добавлении новых типов.

### 3. DayTimeline — программа по дням

Главная секция: программа тура день за днём. **Accordion** (`<details>` HTML5) — свёрнут по умолчанию, разворачивается тапом.

```
[1] День 1 · Тривандрум                             ▼
    Прилёт. Знакомство.
    [activity: culture] [activity: food]
   ┌──────────────────────────────────────┐
   │ [фото локации]                       │
   │ Описание дня (markdown)              │
   └──────────────────────────────────────┘

[2] День 2 · Варкала                                ▼
    [activity: nature] [activity: water]
    ...
```

**Activities** — типизированный набор:
- `culture` 🎵 (Music icon)
- `nature` 🌿 (Leaf)
- `food` 🍴 (UtensilsCrossed)
- `water` 🌊 (Waves)
- `adventure` ⛰ (Mountain)
- `wellness` ✨ (Sparkles)

> **Рекомендация:** если тур имеет «опциональный день» (`isOptional: true` — например треккинг ИЛИ СПА) — выделить визуально badge "на выбор" в шапке аккордеона. **Почему:** клиенты часто пишут «но у меня плохие колени, можно ли...» — упрощает self-service quals на этапе landing.

### 4. Inclusions — включено / не включено

```
┌─────────────────────────┬─────────────────────────┐
│ ✓ Включено              │ ✗ Не включено           │
│  • Все трансферы        │  • Авиабилеты           │
│  • Гид-сопровождение    │  • Виза                 │
│  • Отели 3-4★           │  • Личные расходы       │
│  ...                    │  ...                    │
└─────────────────────────┴─────────────────────────┘
```

Прозрачность важна: не «забыли включить», а **сознательное** разделение.

> **Рекомендация по контенту "Не включено":** не указывать только то, чего вы не делаете. Указывать то, **что клиент мог бы ожидать** что включено, но не входит. Например: «обед в день 5 (рекомендуем местный кафе X)» — здесь «не включено», но мы помогаем найти. **Почему:** клиент не сравнивает с пустотой, он сравнивает с конкурентами и собственными ожиданиями. Чёткое «вот этого нет — но мы помогаем» убирает претензии после поездки.

### 5. Reviews (V1 placeholder, потом Reviews V1)

В фазе 3 на старте — отзывов нет. Секция отображается только если `reviews.length > 0` (см. условный рендер в `page.tsx`).

После первых поездок — текстовые отзывы 4–6 штук (#302). После накопления видео-кружков (#188 + #287) — расширяем до видео-карусели.

> **Рекомендация:** не вставлять placeholder типа «отзывы появятся после первых поездок». Просто скрывать секцию. **Почему:** placeholder читается как «нас никто не покупал» и убивает trust. Лучше отсутствие секции чем самопризнание в отсутствии истории.

### 6. PriceBlock + LeadForm

```
┌─────────────────────────────┬─────────────────────────────┐
│ Бронирование                │   LeadForm                  │
│                             │                             │
│ Этот тур — про вас          │   [Имя              ]       │
│ <description>               │   [Telegram ▾ Phone ▾ Email]│
│                             │   [@username       ]        │
│ Стоимость от                │   [Комментарий     ]        │
│ 250 000 — 320 000 ₽         │   ☑ Согласен с обработкой   │
│ на человека                 │     ПДн (трансгр. в Индию)  │
│                             │   [Отправить заявку]        │
│ [Telegram чат →]            │                             │
└─────────────────────────────┴─────────────────────────────┘
```

**LeadForm:**
- 2-column на desktop, single-column на mobile
- Channel selector: Telegram (default — российская специфика) / Phone / Email
- **Consent чекбокс** обязателен — без него submit blocked. Текст ссылается на `/consent` и `/privacy` с явным упоминанием передачи в Индию (152-ФЗ ст. 12)
- `consentTextVersion` сохраняется на backend (см. `lib/legal/versions.ts → CONSENT_VERSION`)
- Idempotency: при повторном submit без изменений — backend возвращает существующий `leadId` (не дубль)
- Success: in-place message + invite в Telegram

> **Рекомендация по выбору channel:** Telegram default — потому что 60-70% русскоязычных travel-leads предпочитают Telegram над email/phone. **Почему:** мгновенный ответ менеджера, неформальность, привычность. Дополнительный плюс — Telegram ID уже идентифицирует клиента (без нужды в дополнительной верификации).

### 7. FAQ — частые вопросы

Accordion с 5–10 типичными вопросами. Каждый Q/A также попадает в Schema.org FAQPage JSON-LD — Яндекс рендерит expandable вопросы прямо в выдаче (~15-25% CTR boost).

**Типичные вопросы для Кералы:**
- Какая виза нужна?
- Что с прививками?
- Что с едой / диетами?
- Безопасно ли для женщин одних?
- Что если разболеюсь?
- Можно ли с детьми?
- Что включают трансферы?
- Что с интернетом / связью?
- Сколько брать наличных?

> **Рекомендация по контенту FAQ:** writing tone — **honest realism**, не «всё прекрасно». Если вопрос «безопасно для женщин одних?» — отвечаем честно «есть нюансы, вот что мы делаем чтобы было ок» (вместо «абсолютно безопасно»). **Почему:** RU-аудитория high BS-detector. Идеализированные FAQ читаются как реклама и снижают trust. Честность с конкретикой = доверие.

### 8. FooterLegal

```
┌────────────────────────────────────────────┐
│ IndiaHorizone (logo)                       │
│ Tech-enabled India concierge для русско-   │
│ язычных клиентов. Не туроператор. Партнёр  │
│ в Индии — IndiaHorizone IN PVT LTD.        │
│                                            │
│ Компания          | Документы              │
│ ИНН/ОГРН: ...     | Политика конф.         │
│ Юр.адрес: ...     | Согласие на ПДн        │
│                   | Оферта                 │
│                                            │
│ © 2026 IndiaHorizone · Mumbai → Moscow     │
└────────────────────────────────────────────┘
```

ИНН/ОГРН — заполняется после регистрации юрлица (#306).

## Дизайн-система

### Color tokens (см. globals.css)

- `--color-primary` (CTA orange, #e07a3c) — кнопки «Хочу тур», pill accents, активные tabs
- `--color-foreground` (text neutral)
- `--color-background` (page bg)
- `--color-muted` / `--color-muted-foreground` (secondary surfaces)
- `--color-success` (зелёный для check-mark в inclusions)
- `--color-destructive` (красный для error states)

### Typography

- **Body:** Inter (sans-serif, latin + cyrillic) — read-friendly
- **Headings:** Playfair Display (serif, latin + cyrillic) — premium feel
- **Tracking:** uppercase eyebrows = `tracking-[0.2em]` для accent

### Spacing

- Sections: `py-20 sm:py-28` (vertical rhythm)
- Container: `max-w-6xl mx-auto px-6` (контент макс 1152px шириной)
- Grid gaps: `gap-6` для cards, `gap-12` для column-split на desktop

## Performance budget

- **LCP** ≤ 2.5s mobile (slow 3G) — hero poster `<Image priority>`
- **CLS** ≤ 0.1 — все aspect-ratio fixed (`aspect-[16/9]` для day-images, `min-h-[100svh]` для hero)
- **INP** ≤ 200ms — accordion `<details>` через native HTML, не JS
- **JS bundle** ≤ 100kb First Load — `LeadForm` через `next/dynamic` (#309)

См. также [`#309`](https://github.com/Rivega42/indiahorizone/issues/309) для perf оптимизаций и Lighthouse-замеров.

## SEO

См. [`docs/ARCH/CATALOG.md § SEO`](../ARCH/CATALOG.md#seo) для технических деталей. Кратко:

- Schema.org TouristTrip + FAQPage
- OG/Twitter meta
- Yandex-verification
- canonical absolute URL
- ISR + sitemap.xml

## Тестирование per-tour

При добавлении нового тура (1 из 10–15):

1. **Контент:** заполнить `apps/api/prisma/seed/tours/<slug>.json` — все обязательные поля
2. **Изображения:** загрузить hero + day-images в S3 (#350) или Unsplash placeholder
3. **Smoke:** `pnpm dev:web` → `http://localhost:3010/tours/<slug>` рендерится без 404
4. **Visual QA:** открыть в Chrome DevTools mobile-mode 375px (iPhone SE) — проверить все секции читаемы
5. **Schema.org валидация:** Google Rich Results Test + Яндекс.Валидатор
6. **OG preview:** Telegram debugger — preview корректный
7. **Lighthouse mobile:** ≥ 80 Performance + 95 SEO + 95 A11y

> **Рекомендация для контента 10–15 туров:** делайте content-template (markdown) и переиспользуйте структуру **дней одинаковой типологии** (например, "день в backwater" — повторяющаяся секция). **Почему:** Яндекс penalize'ит за повторяющиеся meta-descriptions (`emotional_hook`), но сами тексты дней могут быть похожи между турами — это ОК. Главное чтобы emotional_hook каждого тура был уникальным.

## Следующее

После запуска первых туров (≥ 3 проданных trip'а каждый):
- Реальные текстовые отзывы (#302, #315) → секция Reviews активируется
- Видео-кружки (#287) после первой поездки → секция расширяется
- Lighthouse CI workflow для регрессии (#309 acceptance) — devops:vika territory
- Admin UI для редактирования туров без re-deploy (#311 V2)
