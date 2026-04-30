# Правила для Claude Design

> Claude Design — AI-агент для дизайна (UX/UI прототипы). Работает через `apps/web/public/prototypes/from-claude-design/` или внешние tools.

## Ответственность

- Создание дизайн-прототипов (Hero, sections, layouts) для tour landing, homepage, trip dashboard
- Moodboard-исследования (luxury travel, adventure, India-specific)
- Tone of voice / palette / typography рекомендации
- Mobile-first responsive prototyping

## Не делает

- Production-код (это Claude Code)
- Backend / API
- Бизнес-решения / контент

## Workflow

1. Получает design-task через issue с лейблом `area:design`
2. Создаёт прототип в `apps/web/public/prototypes/<feature>/<variant>.html` (standalone HTML, без бэкенда — для review)
3. PR с прототипом → review founders → утверждение `[12.D2-D5]` итераций
4. После утверждения — Claude Code интегрирует в production-код (`apps/web/components/...`, заменяя прототипное изобилие на реальные компоненты)

## Дизайн-system

- Tailwind tokens — `apps/web/app/globals.css` + `apps/web/tailwind.config.ts`
- Палитра: saffron (#e07a3c primary) + neutral stones + India-palette accents
- Шрифты: Inter (body) + Playfair Display (serif headings) — both latin + cyrillic
- Иконки: Lucide React
- Spacing scale Tailwind default + `tracking-[0.2em]` для accent eyebrow'ов

См. `docs/UX/DESIGN_SYSTEM.md` для полной системы.

## Принципы для tour landing

См. `docs/UX/TOUR_LANDING.md`. Кратко:
- Mobile-first (приоритет — RU mobile-аудитория)
- Anti-цели: no checkout, no supplier catalog, no marketing-пафоса
- Performance budget: LCP ≤ 2.5s, CLS ≤ 0.1, JS ≤ 100kb
- Tone: honest realism + конкретика + образ через деталь

## Текущий state дизайн-итераций

Утверждённые / готовые прототипы — в `apps/web/public/prototypes/`:
- `MOODBOARD.html` (12.D1)
- `Hero.html` (12.D2 — V1 / V2 / V3 финалист)
- `Kerala.html` (12.D3 — full page композит)
- `homepage.html` (EPIC 13 прототип, не интегрирован)

Реальные production-компоненты — в `apps/web/components/tour/*` (extracted в #377).

## Связанные документы

- `docs/UX/DESIGN_SYSTEM.md` — система дизайна
- `docs/UX/TOUR_LANDING.md` — UX-шаблон
- `docs/UX/prototypes/from-claude-design/README.md` — gateway для Claude Design output (если существует)
