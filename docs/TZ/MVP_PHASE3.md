# MVP Phase 3 — что есть, что в работе, что следующее

> Закрывает [#92](https://github.com/Rivega42/indiahorizone/issues/92).
> Документ обновляется живьём по мере прогресса.
> Дата актуализации: 2026-04-25.

## Контекст фазы 3

- ✅ Платящие клиенты есть
- ✅ ТЗ написано на основе их болей и болей сотрудников Shivam
- ✅ Платежи: РФ юрлицо → IN юрлицо (работает на ручке)
- ⚠️ Подавляющее большинство процессов — в WhatsApp/Telegram + Notion/Google Sheets
- 🎯 Цель: вывести критичные процессы в код, начиная с тех, где боль максимальна

## Что уже работает у клиентов (без своего кода)

| Функция | Где работает сейчас | Кто отвечает |
|---|---|---|
| Заявка / квалификация | Telegram + WhatsApp | Roman |
| Сбор маршрута | Notion + Google Docs | Roman + Shivam |
| КП клиенту | Google Docs / PDF | Roman |
| Договор и оплата | РФ юрлицо, инвойсы вручную | Roman + бухгалтер |
| Перевод РФ → IN | Банк-клиент, ручной | Roman |
| Передача дел гиду | WhatsApp | Shivam |
| Чат с клиентом в поездке | WhatsApp | Shivam + concierge (один человек 24/7) |
| Документы клиента | Google Drive | менеджер |
| Фото гида клиенту | WhatsApp | гид |
| SOS | WhatsApp + телефон Shivam | Shivam (узкое место) |

## Что в работе (миграция в код / процесс)

(Берётся из P0 issues — см. [#89](https://github.com/Rivega42/indiahorizone/issues/89) для карты milestones.)

### M1: Compliance Foundation
**Когда:** немедленно.
**Почему:** без этого нельзя легально продавать.

- [ ] [#48](https://github.com/Rivega42/indiahorizone/issues/48) Туроператор vs турагент
- [ ] [#49](https://github.com/Rivega42/indiahorizone/issues/49) 152-ФЗ + Роскомнадзор
- [ ] [#50](https://github.com/Rivega42/indiahorizone/issues/50) Публичная оферта
- [ ] [#52](https://github.com/Rivega42/indiahorizone/issues/52) Согласие на ПДн
- [ ] [#12](https://github.com/Rivega42/indiahorizone/issues/12)–[#15](https://github.com/Rivega42/indiahorizone/issues/15), [#18](https://github.com/Rivega42/indiahorizone/issues/18) Платежи
- [ ] [#8](https://github.com/Rivega42/indiahorizone/issues/8), [#10](https://github.com/Rivega42/indiahorizone/issues/10) Бизнес-модель: продукт + границы

### M2: SOS Production
**Когда:** параллельно M1.
**Почему:** обещание 24/7 уже даём — оно должно быть надёжным.

- [x] [#20](https://github.com/Rivega42/indiahorizone/issues/20) Концепция SOS — закрыто
- [ ] [#21](https://github.com/Rivega42/indiahorizone/issues/21)–[#30](https://github.com/Rivega42/indiahorizone/issues/30) остальные SOS-документы
- [ ] [#32](https://github.com/Rivega42/indiahorizone/issues/32) RACI + смены / [#33](https://github.com/Rivega42/indiahorizone/issues/33) SLA / [#41](https://github.com/Rivega42/indiahorizone/issues/41) Эскалация
- [ ] [#69](https://github.com/Rivega42/indiahorizone/issues/69) Secrets / [#70](https://github.com/Rivega42/indiahorizone/issues/70) 2FA / [#71](https://github.com/Rivega42/indiahorizone/issues/71) Audit

### M3: Repo Bootstrap
**Когда:** в работе сейчас (этот PR).
**Почему:** нужно для старта разработки кода.

- [ ] [#94](https://github.com/Rivega42/indiahorizone/issues/94) `.gitignore`
- [ ] [#95](https://github.com/Rivega42/indiahorizone/issues/95) `LICENSE`
- [ ] [#96](https://github.com/Rivega42/indiahorizone/issues/96) `.env.example`
- [ ] [#100](https://github.com/Rivega42/indiahorizone/issues/100) `CONTRIBUTING.md` правки

## Что следующее (после M1–M3)

### M4: Operations & Onboarding
Чек-листы гида, регламенты онбординга клиента, договор с гидом, остальные согласия. См. карту в [#89](https://github.com/Rivega42/indiahorizone/issues/89).

### M5: «Кружок» Production
Запись/сжатие/очередь/доставка/воспроизведение видео-фидбэка. UX дашборда — ядро + кружок. Базовая архитектура микросервисов.

### M6: Growth & Optional
Программа лояльности, GDPR (если нужно), OpenAPI, traces, расширения дашборда (гайды/утилиты/соц/сервис).

## Метрики успеха фазы 3 → фазы 4

(TODO: согласовать с founders. Предложение для обсуждения.)

| Метрика | Сейчас | Цель |
|---|---|---|
| Платящие клиенты в квартал | <TODO> | <TODO> |
| % клиентов, сделавших ≥ 1 видео-фидбэк | 0 (нет фичи) | ≥ 60% |
| % клиентов, оставивших публичный отзыв | <TODO> | ≥ 40% |
| % реферальных сделок | <TODO> | ≥ 25% |
| Среднее время ответа concierge | <TODO> | ≤ 5 минут (день) / ≤ 15 минут (ночь) |
| Время реакции на SOS | <TODO> | ≤ 60 сек (день) / ≤ 3 мин (ночь) |
| NPS поездки | <TODO> | ≥ 70 |

## Acceptance criteria (#92)

- [x] Файл существует
- [x] 3 секции: «есть / в работе / следующее»
- [x] По каждому модулю — ссылки на issues
- [x] Связь с метриками (TODO для founders)
