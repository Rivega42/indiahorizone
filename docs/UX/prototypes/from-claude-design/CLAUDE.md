# CLAUDE.md — IndiaHorizone Design Project

## Контекст продукта

**Продукт:** IndiaHorizone — tech-enabled India travel concierge для русскоязычных клиентов.
**Репо:** [`Rivega42/indiahorizone`](https://github.com/Rivega42/indiahorizone) (main branch)
**Что это за проект (этот workspace):** дизайн-санбокс для прототипов, которые потом коммитятся в репо в `docs/UX/prototypes/from-claude-design/`.

## Source of truth (всегда читать в начале сессии)

- `docs/UX/DESIGN_SYSTEM.md` — токены, типографика, semantic colors
- `docs/UX/FEATURES/CORE.md` — Trip Dashboard ядро
- `docs/UX/VIDEO_CIRCLE.md` — UX «кружка»
- `docs/UX/prototypes/README.md` — workflow и индекс экранов (статусы 🟡 / 🔵 / 🟢)
- `docs/BACKLOG/M5/A_BOOTSTRAP.md … K_CROSSCUT.md` — атомарные issues по slice'ам

## Бренд

- **Primary:** saffron `hsl(24 95% 53%)` (#F97316)
- **Type:** Inter (cyrillic), `font-feature-settings: 'cv11','ss01'`
- **UI:** только русский
- **Tone:** «вы», глаголы, без жаргона
- **Никакого AI-slop:** без gradient-фонов на каждой карточке, без emoji-иконок в production (только placeholder в прототипах), без Roboto/Arial/Fraunces

## Что уже сделано в этом проекте

- `colors_and_type.css` — токены saffron + semantic + Inter
- `preview/` — карточки токенов (colors / type / spacing / radii / shadows / components / brand)
- `ui_kits/trip_dashboard/` — 9 экранов: auth, profile, index (Trip Dashboard), itinerary, chat, recorder, journal, feedback, sos
- Закрыты UI-части issues #135 (B-010/B-008/B-009/B-011), #147, #154, #156, #170, #179, #184, #190, #198, #199

## Workflow

1. Founder даёт ссылку на code-issue → читаю спеку из BACKLOG/M5
2. Прототипирую в `ui_kits/trip_dashboard/` (HTML + JSX-пара)
3. Регистрирую как asset через `register_assets`
4. Founder коммитит файл в `docs/UX/prototypes/from-claude-design/project/ui_kits/trip_dashboard/` репозитория

## Ограничения роли

- Я делаю **только UI** (HTML/JSX-прототипы). Backend (NestJS, Prisma, JWT, RBAC, argon2, KMS), Mobile-native, e2e Playwright, инфра — НЕ моё.
- Прямых коммитов в `Rivega42/indiahorizone` у меня нет — только read через GitHub-tools. Founder коммитит сам.

## Как не терять контекст

Этот файл — `CLAUDE.md` — подгружается в каждый новый чат внутри проекта автоматически. Если в будущем добавляются новые slice'ы или меняется бренд — обновляй здесь.
