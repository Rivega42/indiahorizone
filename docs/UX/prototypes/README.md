# UX Prototypes — экспортированные из Claude Design

> **Source of truth:** `docs/UX/DESIGN_SYSTEM.md`
> **Workflow для founders:** [`#257`](https://github.com/Rivega42/indiahorizone/issues/257)

## Зачем эта папка

Founders прототипируют экраны в [Claude Design](https://claude.ai/design), Claude Design auto-подхватывает наш design system из репо (`globals.css`, `tailwind.config.ts`, `components.json`, `DESIGN_SYSTEM.md`).

Готовые прототипы экспортируются в HTML и **коммитятся сюда**. Это даёт:

1. **Точку отсчёта для assistant'а** — пишу idiomatic shadcn-код, опираясь на конкретный визуал, не словесное описание
2. **Документацию визуала** — через 6 месяцев dev открывает HTML, видит финальный look, не гадает
3. **History в git** — изменения дизайна отслеживаются по diff'ам HTML/CSS
4. **Independence от Anthropic** — если Claude Design closed/ребрендится, у нас остаётся весь visual history в репо

## Workflow

```
1. Founder описывает экран в Claude Design (см. промпт-стартеры в #257)
2. Claude Design auto-pull tokens → генерит экраны в нашем визуальном языке
3. Founder проверяет, итерирует, утверждает
4. Founder получает API-ссылку от Claude Design (см. ниже формат)
   и/или экспортирует HTML
5. Founder открывает / комментирует в code-issue (#135, #147, #154 и т.д.)
   API-link или путь к закоммиченному HTML
6. Assistant ревьюет (см. checklist в комментарии #257) → пишет
   idiomatic shadcn-код в apps/web/app/(auth)/...
```

### Формат ссылки от Claude Design

```
https://api.anthropic.com/v1/design/h/<hash>?open_file=ui_kits/<theme>/<screen>.html
```

Эту ссылку можно:
- Открыть напрямую в браузере (если есть доступ)
- Передать assistant'у в комментарии issue → assistant fetch'нет через WebFetch
- Использовать как command в Claude Code: «Fetch this design file, read its readme, and implement…»

### Локальный backup (рекомендуется для важных экранов)

Параллельно с API-ссылкой кладём экспортированный HTML в эту папку. Это backup на случай:
- API недоступен (research preview всё-таки)
- Нужен offline-ревью
- Архив в git показывает изменения дизайна по diff'ам

Конвенции файлов:

- **Имя:** одна тема = один файл. Например `auth.html` — все 7 экранов через переключатель сверху.
  Альтернатива: подпапка `auth/` с `login.html`, `register.html`, etc.
- **CSS/JS:** inline или отдельные файлы рядом.
- **Не закоммичивать** `node_modules`, `dist`, скомпилированный output — только source.

## Индекс экранов

> Все prototype-файлы в `from-claude-design/project/ui_kits/trip_dashboard/`. JSX-версии (для React) и HTML-версии (для browser preview) идут парами.

| Тема | Файлы | Code-issue(s) | MVP | Status |
|---|---|---|---|---|
| Auth (login + register + 2FA + reset + suspicious) | [`auth.html`](./from-claude-design/project/ui_kits/trip_dashboard/auth.html) · [`AuthScreens.jsx`](./from-claude-design/project/ui_kits/trip_dashboard/AuthScreens.jsx) | #134, #135, #136 | MVP-1 | 🟡 prototype done, ревью passed |
| Профиль + согласия | [`profile.html`](./from-claude-design/project/ui_kits/trip_dashboard/profile.html) · [`ProfileScreen.jsx`](./from-claude-design/project/ui_kits/trip_dashboard/ProfileScreen.jsx) | #147 | MVP-1 | 🟡 prototype done |
| Trip Dashboard главный | [`index.html`](./from-claude-design/project/ui_kits/trip_dashboard/index.html) · [`TripDashboard.jsx`](./from-claude-design/project/ui_kits/trip_dashboard/TripDashboard.jsx) | #154 | MVP-1 | 🟡 prototype done |
| Маршрут (день за днём) | [`itinerary.html`](./from-claude-design/project/ui_kits/trip_dashboard/itinerary.html) · [`ItineraryScreen.jsx`](./from-claude-design/project/ui_kits/trip_dashboard/ItineraryScreen.jsx) | #156 | MVP-1 | 🟡 prototype done |
| Чат клиент↔concierge | [`chat.html`](./from-claude-design/project/ui_kits/trip_dashboard/chat.html) · [`ChatScreen.jsx`](./from-claude-design/project/ui_kits/trip_dashboard/ChatScreen.jsx) | #170 | MVP-2 | 🟡 prototype done |
| Кружок recorder | [`recorder.html`](./from-claude-design/project/ui_kits/trip_dashboard/recorder.html) · [`RecorderScreen.jsx`](./from-claude-design/project/ui_kits/trip_dashboard/RecorderScreen.jsx) | #179 | MVP-2 | 🟡 prototype done |
| Дневник поездки | [`journal.html`](./from-claude-design/project/ui_kits/trip_dashboard/journal.html) · [`JournalScreen.jsx`](./from-claude-design/project/ui_kits/trip_dashboard/JournalScreen.jsx) | #184 | MVP-2 | 🟡 prototype done |
| Экран фидбэка | [`feedback.html`](./from-claude-design/project/ui_kits/trip_dashboard/feedback.html) · [`FeedbackScreen.jsx`](./from-claude-design/project/ui_kits/trip_dashboard/FeedbackScreen.jsx) | #190 | MVP-2 | 🟡 prototype done |
| SOS (trigger + active + concierge dashboard) | [`sos.html`](./from-claude-design/project/ui_kits/trip_dashboard/sos.html) · [`SOSScreens.jsx`](./from-claude-design/project/ui_kits/trip_dashboard/SOSScreens.jsx) | #198, #199, #200 | MVP-2 | 🟡 prototype done |
| Design system tokens (preview cards) | [`from-claude-design/project/preview/`](./from-claude-design/project/preview/) | DESIGN_SYSTEM.md | — | 🟢 reference |
| Source CSS (saffron + semantic + Inter) | [`colors_and_type.css`](./from-claude-design/project/colors_and_type.css) | DESIGN_SYSTEM.md | — | 🟢 reference |

**Легенда статусов:**
- ⚪ — экран не прототипирован
- 🟡 — prototype в репо, ждёт code-implementation
- 🔵 — code в работе (PR открыт)
- 🟢 — экран в production

## Verification checklist (для assistant)

При получении нового prototype-файла assistant проходит по чек-листу:

- [ ] Design tokens compliance: saffron primary, Inter cyrillic, semantic colors из DESIGN_SYSTEM.md
- [ ] Mobile-first рендер от 360px viewport
- [ ] Accessibility: aria-labels, focus-visible, error position под полем
- [ ] Copywriting tone: «вы», глаголы, без жаргона
- [ ] Error/empty states: понятные сообщения с next-action
- [ ] Anti-enumeration на forgot password
- [ ] Все интерактивные элементы reachable через Tab
- [ ] Reduced-motion respect (если есть animations)

См. полный checklist — в комментарии [`#257`](https://github.com/Rivega42/indiahorizone/issues/257).

## Что НЕ делаем здесь

- **Не используем prototype HTML напрямую в production** — он генерится AI, не идиоматичен shadcn, может содержать AI-quirks. Production code пишет assistant в `apps/web/`, опираясь на визуал.
- **Не коммитим скомпилированные / minified версии** — только human-readable source.
- **Не правим prototype руками** — изменения вносим через Claude Design, переэкспортируем.

## Связь с code

Каждый prototype линкуется на свой code-issue через таблицу выше.
Каждый code-issue в своём PR ссылается на prototype через path:

```md
> Prototype: [`docs/UX/prototypes/auth.html`](https://github.com/Rivega42/indiahorizone/blob/main/docs/UX/prototypes/auth.html)
```
