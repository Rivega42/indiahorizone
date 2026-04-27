# UI Kit — Trip Dashboard

Mobile-first клиентский кабинет IndiaHorizone. Главный экран по спецификации [`docs/UX/FEATURES/CORE.md`](https://github.com/Rivega42/indiahorizone/blob/main/docs/UX/FEATURES/CORE.md).

## Состав
- **`IHPageHeader`** — флаг страны + локация + «День N из M» + аватар
- **`IHTimelineCard`** — Сейчас + Следующее с countdown
- **`IHQuickActions`** — 4-up grid: Документы / Маршрут / Concierge / Гид
- **`IHCircleCard`** — приглашение записать кружок дня
- **`IHSosButton`** — hold-to-trigger SOS (2 сек заполнение, можно отменить отпусканием)
- **`IHBottomSheet`** — sheet с handle bar и close, для документов / маршрута / чата
- **`IHDocRow`** — строка документа с offline-бейджем

## Как открыть
`index.html` → mobile preview 420×820. Тапы на quick actions открывают bottom sheets. Hold на SOS активирует через 2 сек. Запись кружка → toast → status «отправлено».

## Заметки
- Все цвета — через `colors_and_type.css` CSS-переменные.
- Иконки текущей версии — emoji (быстрые маркеры из спеки CORE.md). В production-коде заменяются на Lucide.
- Статус-бар и home-indicator нарисованы простой обёрткой phone shell — для production используйте `ios-frame.jsx` стартер.
