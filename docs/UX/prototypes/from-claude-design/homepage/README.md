# Homepage prototype (Claude Design)

Прототип главной страницы IndiaHorizone, сгенерированный в Claude Design (April 2026).

## Структура

- `src/` — JSX-исходники компонентов (14 секций: Hero, Destinations, Tours, IndiaMap, Quiz, Reviews, Guides, Blog, Booking, FAQ, Footer и др.)
- `styles/` — кастомные CSS с дизайн-токенами (только saffron-палитра, остальные удалены)
- `India Horizone.html` — лёгкая loader-обёртка
- `India Horizone-standalone-src.html` — source view standalone
- `screenshots/` — скриншоты из Claude Design
- `uploads/` — загруженные ассеты

## Где открыть

Standalone версия (один файл со всем embedded):

- **Локально (dev):** `http://localhost:3000/prototypes/homepage.html` после `pnpm --filter @indiahorizone/web dev`
- **В файловой системе:** `apps/web/public/prototypes/homepage.html`

## Что важно знать о прототипе

### ✅ Соответствует нашему бренду
- Tagline «Индия без хаоса» + subtag «Tech-enabled India concierge для русскоязычных»
- Saffron primary `hsl(24 95% 53%)` (одна палитра, остальные удалены — Roman утвердил 27.04.2026)
- Шрифты: Inter + Playfair Display + JetBrains Mono

### ⚠️ Placeholder-контент (заменить до прода)

Прототип использует наглядные заглушки. Перед запуском рекламы **обязательно** заменить:

1. **«14 лет отправляем путешественников» в footer** — стартап. Враньё нарушает 38-ФЗ.
2. **3 выдуманных отзыва** (Анна Верьёвкина, Дмитрий Северин, Марина Куц) — UGC-фейк, ст.5 38-ФЗ.
3. **4 фейк-гида** (Арджун Мехра, Прия Айер и др.) с фото из Unsplash — ст.152.1 ГК (изображение реальных людей под выдуманными именами).
4. **Цены туров** (89к/124к/178к/215к) — подтвердить юнит-экономику с Шивамом.
5. **Контакты в footer** (`hello@horizone.in`, `+7 495 000 00 00`, `@horizone`) — заменить на реальные.

См. отдельный P0-блокер issue в EPIC 13.

## Workflow

1. Roman даёт prompt в Claude Design
2. Claude Design коммитит результат в этот каталог
3. Claude Code (я) переносит в `apps/web/app/` как Next.js страницы
4. Roman ревьюит → утверждает → PR в main
