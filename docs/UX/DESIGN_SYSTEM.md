# Design System v0 — IndiaHorizone

> **Статус:** v0.1 (initial). Источник истины для всех UI-issues.
> **Owner:** Roman + assistant.
> **Стиль:** премиум-минимализм SaaS (Linear / Vercel / Booking Genius) + saffron-accent как nod к India.

## Принципы

1. **Tokens в коде — source of truth.** `globals.css` и `tailwind.config.ts` — единственное место правды. Этот документ — справочник по их использованию.
2. **shadcn/ui как база.** Компоненты копируются в `apps/web/components/ui/`, не как npm-зависимость. Полный контроль над кодом.
3. **Mobile-first.** Главный сценарий — клиент в Индии со смартфоном. Десктоп — fallback.
4. **Accessibility ≥ WCAG 2.2 AA.** Контраст ≥ 4.5:1 для body, focus-visible везде, aria-label на icon-only buttons.
5. **Русский язык — родной.** Inter с cyrillic subset. Никаких английских вставок в UI.
6. **Лаконичность.** Кнопка с глаголом, не существительным. Empty state с next-action.

## Color palette

Все цвета — HSL для удобства dark-mode и тонкой настройки яркости. Определены как CSS-переменные в `globals.css`, потребляются Tailwind через `tailwind.config.ts`.

### Brand

| Token | Light | Dark | Использование |
|---|---|---|---|
| `--primary` | `24 95% 53%` (saffron) | `24 95% 53%` | CTA, акценты, активные состояния, ссылки |
| `--primary-foreground` | `0 0% 100%` (white) | `0 0% 7%` (near-black) | Текст на primary |

> **Saffron — единственный indian-color акцент.** Не добавлять зелёный/фиолетовый/золотой Mughal-палитры — это превратит UX в стереотип турагентства. См. parent issue #255.

### Neutrals

| Token | Light | Dark | Использование |
|---|---|---|---|
| `--background` | `0 0% 100%` | `0 0% 7%` | Фон страниц |
| `--foreground` | `0 0% 9%` | `0 0% 96%` | Основной текст |
| `--muted` | `0 0% 96%` | `0 0% 15%` | Карточки, secondary surfaces |
| `--muted-foreground` | `0 0% 45%` | `0 0% 64%` | Secondary текст, captions |
| `--border` | `0 0% 90%` | `0 0% 20%` | Рамки, разделители |
| `--input` | `0 0% 90%` | `0 0% 20%` | Border у input fields |
| `--ring` | `24 95% 53%` | `24 95% 53%` | Focus-ring (= primary) |
| `--accent` | `0 0% 96%` | `0 0% 15%` | Hover на secondary |
| `--accent-foreground` | `0 0% 9%` | `0 0% 96%` | Текст на accent |
| `--card` | `0 0% 100%` | `0 0% 9%` | Фон карточки |
| `--card-foreground` | `0 0% 9%` | `0 0% 96%` | Текст на карточке |

### Semantic

| Token | Light | Dark | Использование |
|---|---|---|---|
| `--success` | `142 71% 45%` | `142 71% 45%` | Успех, оплачено, ack-получен |
| `--success-foreground` | `0 0% 100%` | `0 0% 7%` | — |
| `--warning` | `38 92% 50%` | `38 92% 50%` | Предупреждение, истекает срок |
| `--warning-foreground` | `0 0% 7%` | `0 0% 7%` | — |
| `--destructive` | `0 84% 60%` | `0 72% 51%` | Ошибка, удаление, **SOS-критично** |
| `--destructive-foreground` | `0 0% 100%` | `0 0% 96%` | — |
| `--info` | `217 91% 60%` | `217 91% 60%` | Подсказки, neutral-уведомления |
| `--info-foreground` | `0 0% 100%` | `0 0% 7%` | — |

> **SOS-кнопка использует `--destructive`.** В русскоязычной аудитории красный = «опасность/SOS», что усиливает intuitive recognition. Альтернатива (saffron primary) рискует слиться с обычными CTA.

## Typography

Шрифт: **Inter** (через `next/font/google` с subsets `latin + cyrillic`). Mono fallback: `ui-monospace, "JetBrains Mono", Consolas, monospace` для кода и tabular чисел.

| Token | Tailwind class | Размер | Line-height | Letter-spacing | Использование |
|---|---|---|---|---|---|
| `display` | `text-5xl font-bold` | 48px | 1.1 | -0.02em | Hero, landing, marketing |
| `h1` | `text-4xl font-semibold` | 36px | 1.15 | -0.015em | Главный заголовок страницы |
| `h2` | `text-2xl font-semibold` | 24px | 1.25 | -0.01em | Секция |
| `h3` | `text-xl font-semibold` | 20px | 1.3 | normal | Карточка, подсекция |
| `h4` | `text-lg font-medium` | 18px | 1.35 | normal | Item-title в списках |
| `body-lg` | `text-base` | 16px | 1.5 | normal | Lead-параграф, основной текст в премиум-сегменте |
| `body` | `text-sm` | 14px | 1.5 | normal | Body текст, форма-поля |
| `body-sm` | `text-xs` | 12px | 1.4 | normal | Captions, helper text, timestamps |
| `caption` | `text-xs uppercase tracking-widest` | 12px | 1.3 | 0.15em | Eyebrow / category-label |

**Веса:** `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700). Italic — только для cited text, не для emphasis.

> **Body 14px (text-sm) по умолчанию.** Inter в русском хорошо читается на 14px от 360px viewport. Для премиум-секций (landing, оферта) — `body-lg` 16px.

## Spacing

Базовая шкала Tailwind (4px grid): `0.5` (2px), `1` (4px), `2` (8px), `3` (12px), `4` (16px), `6` (24px), `8` (32px), `12` (48px), `16` (64px), `24` (96px).

**Custom semantic:**

- `space-screen` = `px-4 sm:px-6 lg:px-8` — горизонтальные паддинги страницы
- `space-section` = `py-12 sm:py-16 lg:py-24` — между секциями landing
- `space-card` = `p-4 sm:p-6` — внутри карточки
- `space-stack-tight` = `space-y-2` — между связанными элементами
- `space-stack` = `space-y-4` — между параграфами
- `space-stack-loose` = `space-y-8` — между группами

## Border radius

| Token | px | Использование |
|---|---|---|
| `--radius-sm` | 4px (`calc(var(--radius) - 4px)`) | Inline tags, badges |
| `--radius-md` | 6px (`calc(var(--radius) - 2px)`) | Inputs, small buttons |
| `--radius-lg` | 10px (`var(--radius)` = 0.625rem) | Кнопки, карточки (default) |
| `--radius-xl` | 16px | Большие карточки, modals |
| `--radius-full` | 9999px | Pills, avatars, FAB |

## Shadow

| Token | CSS | Использование |
|---|---|---|
| `shadow-sm` | `0 1px 2px hsl(0 0% 0% / 0.05)` | Subtle separation |
| `shadow-md` | `0 4px 6px -1px hsl(0 0% 0% / 0.1)` | Карточки в hover |
| `shadow-lg` | `0 10px 15px -3px hsl(0 0% 0% / 0.1)` | Modals, popovers, sheets |
| `shadow-xl` | `0 20px 25px -5px hsl(0 0% 0% / 0.1)` | SOS-кнопка, elevated CTA |

## Animation

Tailwind defaults + кастомные tokens.

| Token | Duration | Easing | Использование |
|---|---|---|---|
| `duration-fast` | 100ms | `ease-out` | Hover, focus, micro-interactions |
| `duration-base` | 200ms | `ease-in-out` | Default для transitions |
| `duration-slow` | 300ms | `ease-in-out` | Modal open/close, drawer |
| `duration-lazy` | 500ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Page transitions, important reveals |

**Кастомные keyframes** (определяются в `tailwind.config.ts`):
- `pulse-soft` — для loading states
- `slide-up` — для toast, drawer
- `scale-in` — для dialog open
- `sos-charge` — для hold-to-trigger SOS-кнопки (заполнение круга за 2 сек)

## Иконография

**Lucide React** (`lucide-react@^0.453.0`) как baseline. Все иконы — outline 24×24 viewBox, stroke 2px, currentColor.

| Размер класс | Pixel | Использование |
|---|---|---|
| `size-icon-sm` | 16px (`w-4 h-4`) | Inline в тексте, badges |
| `size-icon-md` | 20px (`w-5 h-5`) | Buttons (default) |
| `size-icon-lg` | 24px (`w-6 h-6`) | Heroes, navigation |
| `size-icon-xl` | 32px (`w-8 h-8`) | Pageblock-emphasis, illustrations |

**Кастомные иконы** (если потребуются):
- `IconSosShield` — для SOS-кнопки (создаётся в `components/icons/` при работе над #198)
- `IconCircleRecord` — для recorder кружка (создаётся при #179)

> **Не добавлять Heroicons / Phosphor / Tabler** в дополнение к Lucide. Mixing icon-libraries даёт визуальную несогласованность.

## Component conventions

Когда что использовать:

| Сценарий | Компонент | Почему |
|---|---|---|
| Primary action | `Button` (variant=default) | Saffron-primary, max 1 на экран |
| Secondary action | `Button variant="outline"` | Border + transparent fill |
| Destructive action | `Button variant="destructive"` | Красный, с подтверждением для irreversible |
| Icon-only action | `Button variant="ghost" size="icon"` | + обязательный `aria-label` |
| Modal blocking flow | `Dialog` | Login, AML-flag, edit паспорта |
| Mobile-first slide-in | `Sheet` (Drawer) | Документы, меню, фильтры на мобильном |
| Tooltip-like info | `Popover` | Объяснение поля, helper |
| Notification (transient) | `Toast` | «Сохранено», «Отправлено» — auto-dismiss 4 сек |
| Notification (permanent) | `Alert` / `Banner` | «Истекает виза», «AML на проверке» |
| Контейнер контента | `Card` | Карточка поездки, документ, кружок |
| Sectioned data | `Tabs` | Профиль (личные / согласия / контакты) |
| Selection one-of-many | `RadioGroup` | Метод оплаты, тип согласия |
| Multi-select | `Checkbox` (group) | Уровни consent (1/2/3/4) |
| Toggle binary | `Switch` | Push notifications on/off |

## Form patterns

- **Validation timing:** `onBlur` по умолчанию. `onChange` только для critical (password meter, AML-flag triggers).
- **Error position:** под полем, красным `text-destructive text-xs mt-1`. Не tooltip.
- **Required marker:** красная звёздочка после label `<label>Email <span class="text-destructive">*</span></label>`.
- **Helper text:** под полем, `text-muted-foreground text-xs`. Например «Используется только для восстановления пароля».
- **Submit-кнопка:** глагол + объект — «Отправить код», не «OK».
- **Disabled states:** `opacity-50 cursor-not-allowed` + tooltip объясняющий почему.
- **Loading state submit:** spinner внутри кнопки, текст меняется на «Отправляем...».

## Accessibility minimums

- **WCAG 2.2 AA** — обязательно, AAA — где не мешает дизайну
- **Контраст:** ≥ 4.5:1 для body, ≥ 3:1 для UI components
- **Focus-visible:** `focus-visible:ring-2 ring-ring ring-offset-2 ring-offset-background` везде
- **Keyboard nav:** все intractive элементы reachable через Tab; Esc закрывает модалы; Enter активирует focused; arrow-keys в RadioGroup
- **ARIA:** `aria-label` для icon-only, `aria-describedby` для error-связи, `role="alert"` для toast/banner
- **Reduced motion:** уважать `prefers-reduced-motion: reduce` для всех animations
- **Screen reader:** sr-only утилита для visual-hidden text (`sr-only` Tailwind class)

## Responsive breakpoints

Tailwind defaults (mobile-first):

| Prefix | Width | Устройство |
|---|---|---|
| (default) | 0–639 | Mobile |
| `sm:` | ≥ 640 | Large mobile / small tablet |
| `md:` | ≥ 768 | Tablet |
| `lg:` | ≥ 1024 | Laptop |
| `xl:` | ≥ 1280 | Desktop |
| `2xl:` | ≥ 1536 | Large desktop |

> **Дизайн начинаем с 360px viewport.** Это minimum, который встречается у российских клиентов с старыми Android.

## Tone of voice (copywriting)

- **Обращение:** «вы», но тёплое. Не «уважаемый клиент», не «дорогой пользователь». Просто «вы».
- **Глаголы вместо существительных:** «Открыть документы», не «Документы».
- **Явные CTA:** «Записать кружок», не «Создать запись».
- **Empty states с next-action:** «Здесь появятся ваши кружки. Запишите первый →».
- **Ошибки без вины:** «Не получилось загрузить — проверьте подключение и попробуйте снова», не «Вы ввели неверные данные».
- **Без жаргона:** «маршрут», не «itinerary». «Поездка», не «трип». «Согласие», не «consent».
- **Числа:** русское форматирование («₽» после числа: `42 000 ₽`, не `₽42,000`). Mono-font для tabular данных.
- **Даты:** «25 апр 2026, 14:30», не «04/25/26 2:30 PM». Локализация через `Intl.DateTimeFormat('ru-RU')`.

> **«Кружок» — наш термин.** Не «видео-фидбэк», не «video circle». В UI везде — «кружок».

## Dark mode

- **Не приоритет MVP-1 / MVP-2.** Системное переключение через `prefers-color-scheme` — да, явный toggle — нет.
- CSS-переменные уже определены для обоих режимов в `globals.css`.
- Все компоненты shadcn/ui auto-адаптируются через CSS-vars.
- При работе UX-issues — проверять оба режима, но финальная полировка dark-mode откладывается до W31 (production-ready).

## Что вне scope этой версии

- Анимированные иллюстрации
- Lottie / Rive
- Custom font (только Inter)
- Multi-brand (один brand)
- RTL (только LTR)

## Связь с инструментами

- [`apps/web/app/globals.css`](../../apps/web/app/globals.css) — CSS-переменные (источник)
- [`apps/web/tailwind.config.ts`](../../apps/web/tailwind.config.ts) — Tailwind extend (потребляет CSS-переменные)
- [`apps/web/components.json`](../../apps/web/components.json) — shadcn config
- **Claude Design** ([claude.ai/design](https://claude.ai/design)) — auto-pull tokens из репо для прототипирования. См. issue #257.
- [`docs/UX/prototypes/`](./prototypes/) — экспортированные HTML-прототипы из Claude Design + API-ссылки. Workflow приёма новых экранов — в README этой папки.

## Acceptance

- [x] Файл существует
- [x] Color palette с brand + neutrals + semantic
- [x] Typography scale
- [x] Spacing / radius / shadow / animation tokens
- [x] Component conventions
- [x] Form patterns
- [x] Accessibility minimums
- [x] Tone of voice
- [ ] `globals.css` обновлён под полную палитру (см. issue #256 PR)
- [ ] `tailwind.config.ts` обновлён (semantic colors, animation, typography preset)
- [ ] Утверждение Roman + первый прототип в Claude Design (через #257)
