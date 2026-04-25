# IndiaHorizone — техническое задание v1.0

> Каркас-индекс. Закрывает [#90](https://github.com/Rivega42/indiahorizone/issues/90).
> Версия: 1.0 (фаза 3 — клиенты есть, ТЗ написано на основе их болей и болей сотрудников Shivam)
> Статус: рабочий, развивается итеративно по эпикам

Старая версия 0.1 → [`docs/archive/TZ-v0.1.md`](../archive/TZ-v0.1.md) (issue [#91](https://github.com/Rivega42/indiahorizone/issues/91)).

## Точка входа

| Если вы | Идите в |
|---|---|
| Новый разработчик | [Принципы](#принципы) → [Архитектура](#архитектура) → текущий sprint |
| Бизнес-партнёр | [Бизнес-модель](#бизнес-модель) → [Границы продукта](#границы-продукта) |
| Гид / concierge | [Операционные регламенты](#операции) |
| Юрист / финансист | [Юридика](#юридика) → [Финансы](#финансы) |
| Founder | [MVP фаза 3](./MVP_PHASE3.md) — что есть / что в работе / что дальше |

## Эпики (см. issues #1, #11, #19, #31, #47, #57, #77, #86, #89, #93)

| Эпик | Issue | Статус | Документ |
|---|---|---|---|
| 1. Документация продукта | [#1](https://github.com/Rivega42/indiahorizone/issues/1) | in progress | `docs/JTBD.md`, `docs/USER_STORIES.md`, `docs/BUSINESS_MODEL.md`, `docs/BUSINESS_MODEL/UNIT_ECONOMICS.md` |
| 2. Платежи и финансы | [#11](https://github.com/Rivega42/indiahorizone/issues/11) | open | `docs/FINANCE/` |
| 3. SOS | [#19](https://github.com/Rivega42/indiahorizone/issues/19) | open | `docs/SOS/` |
| 4. Операции | [#31](https://github.com/Rivega42/indiahorizone/issues/31) | open | `docs/OPS/` |
| 5. Юридика и compliance | [#47](https://github.com/Rivega42/indiahorizone/issues/47) | open | `docs/LEGAL/` |
| 6. Архитектура (микросервисы) | [#57](https://github.com/Rivega42/indiahorizone/issues/57) | open | `docs/ARCH/` |
| 7. UX и фичи | [#77](https://github.com/Rivega42/indiahorizone/issues/77) | open | `docs/UX/` |
| 8. Программа лояльности | [#86](https://github.com/Rivega42/indiahorizone/issues/86) | in progress | `docs/LOYALTY/` |
| 9. ТЗ v1.0 (этот документ) | [#89](https://github.com/Rivega42/indiahorizone/issues/89) | in progress | `docs/TZ/` |
| 10. Гигиена репозитория | [#93](https://github.com/Rivega42/indiahorizone/issues/93) | open | корень репо |

## Принципы

(Из [`CLAUDE.md`](../../CLAUDE.md), кратко:)

1. **Думай перед кодом** — компромиссы озвучивать, не молчать.
2. **Простота прежде всего** — минимум кода, никаких абстракций сверх задачи.
3. **Хирургические изменения** — трогать только то, что нужно.
4. **Целевое исполнение** — критерии успеха формулируются явно.

Продуктовые принципы:

1. **Оффлайн-first** — клиент в Индии не должен зависеть от стабильного интернета.
2. **Mobile-first** — основные сценарии для смартфона.
3. **Русскоязычный UX** — UI без английских вставок.
4. **Доверие через прозрачность** — клиент знает, что происходит и что будет дальше.
5. **Минимум шагов** — SOS, фидбэк, доп.услуга — максимум 2 тапа.

## Бизнес-модель

См. [`docs/BUSINESS_MODEL.md`](../BUSINESS_MODEL.md) (issues [#8](https://github.com/Rivega42/indiahorizone/issues/8), [#9](https://github.com/Rivega42/indiahorizone/issues/9), [#10](https://github.com/Rivega42/indiahorizone/issues/10)).

Кратко:
- Что продаём: кастомный маршрут + наземное сопровождение в Индии.
- Что НЕ продаём в фазе 3: авиабилеты, страховку — только рекомендуем.
- Платежи: РФ юрлицо → IN юрлицо. См. [`docs/FINANCE/`](../FINANCE/).

Юнит-экономика — [`docs/BUSINESS_MODEL/UNIT_ECONOMICS.md`](../BUSINESS_MODEL/UNIT_ECONOMICS.md) (#9).

## JTBD и user stories

- [`docs/JTBD.md`](../JTBD.md) — клиентские и внутренние JTBD.
- [`docs/USER_STORIES.md`](../USER_STORIES.md) — INVEST-истории по ролям с приоритетами P0/P1/P2.

## Границы продукта

См. [`docs/BUSINESS_MODEL.md` § Граница ответственности](../BUSINESS_MODEL.md) (issue [#10](https://github.com/Rivega42/indiahorizone/issues/10)).

## Операции

См. [`docs/OPS/`](../OPS/) (EPIC 4 — issue [#31](https://github.com/Rivega42/indiahorizone/issues/31)).

Особое внимание:
- [`docs/OPS/STRUCTURE.md`](../OPS/STRUCTURE.md) — RACI, смены 24/7
- [`docs/OPS/SLA.md`](../OPS/SLA.md) — SLA по каналам
- [`docs/OPS/ESCALATION.md`](../OPS/ESCALATION.md) — матрица эскалации

## SOS

См. [`docs/SOS/`](../SOS/) (EPIC 3 — issue [#19](https://github.com/Rivega42/indiahorizone/issues/19)).

Стартовая точка: [`docs/SOS/CONCEPT.md`](../SOS/CONCEPT.md) — что обещаем и что не обещаем.

## Юридика

См. [`docs/LEGAL/`](../LEGAL/) (EPIC 5 — issue [#47](https://github.com/Rivega42/indiahorizone/issues/47)).

Стартовые точки:
- [`docs/LEGAL/TOUR_OPERATOR.md`](../LEGAL/TOUR_OPERATOR.md) — статус: туроператор vs турагент
- [`docs/LEGAL/PDN.md`](../LEGAL/PDN.md) — 152-ФЗ
- [`docs/LEGAL/CONTRACTS/CLIENT_OFFER.md`](../LEGAL/CONTRACTS/CLIENT_OFFER.md) — оферта клиенту

## Финансы

См. [`docs/FINANCE/`](../FINANCE/) (EPIC 2 — issue [#11](https://github.com/Rivega42/indiahorizone/issues/11)).

## Архитектура

См. [`docs/ARCH/`](../ARCH/) (EPIC 6 — issue [#57](https://github.com/Rivega42/indiahorizone/issues/57)).

## UX

См. [`docs/UX/`](../UX/) (EPIC 7 — issue [#77](https://github.com/Rivega42/indiahorizone/issues/77)).

## Программа лояльности

См. [`docs/LOYALTY/`](../LOYALTY/) (EPIC 8 — issue [#86](https://github.com/Rivega42/indiahorizone/issues/86)).

Принцип: не делаем накопительные баллы, делаем три простых механики — реферал, repeat-привилегии, UGC через дневник поездки.

## Глоссарий

| Термин | Определение |
|---|---|
| Trip Dashboard | Клиентский кабинет — мобильное приложение / PWA с маршрутом, документами, фидбэком, SOS |
| Кружок | Видео-фидбэк клиента до 60 сек, по аналогии с Telegram. Ключевая UGC-механика |
| Concierge | Поддержка 24/7. Принимает все обращения клиента и эскалирует в команду |
| Гид | Локальный оператор в Индии — встречает, ведёт, сопровождает |
| Менеджер | Sales — продаёт поездки и собирает маршрут |
| Управляющий / admin | Founder, видит метрики и делает стратегические решения |
| SOS | Экстренная связь клиента в ЧП — отдельный микросервис с гарантированной доставкой |
| RACI | Матрица распределения ролей (Responsible, Accountable, Consulted, Informed) |
| SLA | Service Level Agreement — контракт о времени реакции |
| ПДн | Персональные данные (152-ФЗ) |
| 115-ФЗ | Антиотмывочный закон РФ, требует идентификации клиентов |
| Inter-co | Inter-company — переводы между нашими РФ и IN юрлицами |
| TDS | Tax Deducted at Source — индийский удерживаемый налог |
| Фаза 3 | Текущая стадия проекта: клиенты есть, ТЗ валидировано болями |
| Carve-in / carve-out | Решение «оставить в продукте» / «выкинуть из продукта» |

## Команда

| Роль | Кто | Зона |
|---|---|---|
| Founder, продукт, технологии | Roman | EPIC 1, 6, 7, 9, 10 |
| Founder, операции, локальная сеть | Shivam | EPIC 3, 4 |
| Финансы | TBD | EPIC 2 |
| Юрист | TBD (внешний) | EPIC 5 |

## Changelog

- `1.0` (2026-04) — переход на каркас-индекс, версия v0.1 архивирована.
- `0.1` (2026-04) — монолитный документ, см. `docs/archive/TZ-v0.1.md`.
