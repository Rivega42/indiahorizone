# IndiaHorizone Design System

> Tech-enabled India concierge для русскоязычных клиентов.
> Премиум-минимализм SaaS (Linear / Vercel / Booking Genius) + saffron-accent как nod к India.

---

## О бренде

**IndiaHorizone** — нишевой travel-tech сервис: персональные поездки в Индию для русскоязычных клиентов с локальной поддержкой, понятным маршрутом и сопровождением на каждом этапе.

**Внутренняя формула:**
> Не турагентство. Не просто путешествия. А tech-enabled India concierge для русскоязычных клиентов.

**Ключевые продукты:**
- 📱 **Trip Dashboard** (mobile + web) — клиентский кабинет: маршрут, документы, кружок-фидбэк, SOS, оффлайн-доступ
- 🛠️ **CRM** — менеджерская панель: воронка, карточки клиентов, коммуникация
- 👨‍💼 **Operational panel** — для гидов в Индии
- 📊 **Analytics** — для управляющих

**Аудитория:** русскоязычные путешественники 30–55 лет, средний+ сегмент. Хотят Индию **без хаоса** — управляемо, безопасно, с поддержкой на родном языке.

---

## CONTENT FUNDAMENTALS

### Тон
- **Тёплый, спокойный, профессиональный.** Не «ура-туризм», не корпоративный канцелярит.
- **Без жаргона.** «Маршрут», не «itinerary». «Поездка», не «трип». «Согласие», не «consent».
- **Снижение тревоги.** Тексты должны успокаивать клиента в чужой стране.

### Обращение
- Только **«вы»**, тёплое. Без «уважаемый клиент» или «дорогой пользователь».
- Никогда не «ты».

### Casing
- **Sentence case** в кнопках, заголовках, метках. («Открыть документы», не «Открыть Документы» и не «ОТКРЫТЬ ДОКУМЕНТЫ»)
- ALL CAPS только для eyebrow-меток с `tracking-widest` (caption).

### Глаголы и CTA
- **Глагол + объект.** «Открыть документы» вместо «Документы». «Записать кружок» вместо «Создать запись».
- **Submit-кнопки:** глагол + объект — «Отправить код», не «OK».
- **Empty states с next-action:** «Здесь появятся ваши кружки. Запишите первый →».

### Ошибки без вины
- «Не получилось загрузить — проверьте подключение и попробуйте снова», **не** «Вы ввели неверные данные».

### Числа и даты
- Русское форматирование: `42 000 ₽` (не `₽42,000`).
- Даты: `25 апр 2026, 14:30` (не `04/25/26 2:30 PM`).
- Tabular-nums (моноширинные цифры) для цен, таймеров, счётчиков.

### Эмодзи
- **Используются умеренно** — как функциональные маркеры в UI: 🇮🇳 страна, 📂 документы, 🗺️ маршрут, 💬 чат, 📞 звонок, 🆘 SOS, 🎬 кружок, ✅ готово, 📡 нет сети.
- Не как декорация. Не в формальных текстах (оферта, политика).

### Внутренние термины
- **«Кружок»** — это видео-фидбэк (60 сек кругом). Не «video circle», не «видео-отзыв».
- **«День N из M»** — стандартная локация в поездке.
- **«Сейчас» / «Следующее»** — два опорных раздела таймлайна.

### Примеры копирайта
| ✅ Хорошо | ❌ Плохо |
|---|---|
| «Как прошёл день?» | «Оцените ваш опыт сегодня» |
| «Помощь идёт. Дежурный — Мария. Ответ ~60 сек» | «Ваш запрос принят» |
| «В очереди — отправим, как появится сеть» | «Ошибка отправки» |
| «Записать кружок» | «Создать видео-отзыв» |
| «Открыть документы» | «Документы» |

---

## VISUAL FOUNDATIONS

### Палитра
- **Один акцент — saffron** `hsl(24 95% 53%)` (#F58A1F). Все CTA, focus-rings, активные состояния, ссылки.
- **Никаких stereotype-Indian**: не добавлять Mughal-зелёный, золотой, фиолетовый. Saffron — единственный nod к Индии.
- **Нейтрали** — холодный true-grayscale (HSL `0 0%`), от white до near-black `#121212`.
- **Семантика**: success зелёный `#1FB95C`, warning оранжевый `#F2A516`, destructive красный `#EF4444` (= SOS), info синий `#3D7DF6`.

### Типографика
- **Inter** (Google Fonts, subsets `latin + cyrillic`). Веса 400 / 500 / 600 / 700.
- Mono fallback: `ui-monospace, "JetBrains Mono"` — для tabular чисел и кода.
- **Body 14px** (text-sm) по умолчанию — Inter в кириллице хорошо читается на 14px.
- Заголовки `font-semibold`, не `font-bold` (премиум-вайб).
- Letter-spacing отрицательный для крупного типа (-0.015em–-0.02em).
- Italic — только для cited text.

### Backgrounds
- **Чистый white / near-black**. Без градиентов, без декоративных текстур.
- Нет full-bleed photo backgrounds в UI (фото только внутри карточек/imagery).
- Нет hand-drawn illustrations, нет pattern fills.

### Borders & cards
- **Border-radius** базовый = `10px` (`--radius`). Inputs `8px`, badges `6px`, big cards `16px`, pills/avatars `9999px`.
- **Cards** — фон `--card` (white) + 1px border `--border` (`hsl(0 0% 90%)`) + опционально `shadow-sm`. Без heavy drop shadows.
- **No left-accent-border cards.** Это slop-троп.

### Shadows
- Очень мягкая система: `sm` (1px), `md` (карточка hover), `lg` (modal), `xl` (SOS-кнопка, elevated CTA).
- Все shadow — нейтрально-чёрные с низкой альфой (5–10%). Без цветных свечений.

### Spacing
- 4px grid (Tailwind). Scale: 2 / 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.
- Page padding: `px-4` mobile → `px-6` sm → `px-8` lg.
- Cards: `p-4` mobile → `p-6` desktop.
- Между параграфами: `space-y-4`. Между группами: `space-y-8`.

### Animation
- **Быстро и сдержанно.** 100ms для микро (hover/focus), 200ms по умолчанию, 300ms для drawer/modal, 500ms для page transitions.
- Easing: `ease-out` для входа, `ease-in-out` дефолт, `cubic-bezier(0.4, 0, 0.2, 1)` для важных reveal.
- Нет bounces, нет spring-overshoot. Нет Lottie, нет Rive.
- **SOS-charge** (2 сек заполнение круга) — единственная характерная анимация.
- Уважаем `prefers-reduced-motion`.

### Hover / press states
- **Hover на primary**: `opacity-90` или чуть темнее (`brightness-95`).
- **Hover на ghost/outline**: фон `--accent` (= `hsl(0 0% 96%)`).
- **Press**: `scale-[0.98]` + `opacity-90`. Никакого heavy shrink.
- **Focus-visible** обязательно: `ring-2 ring-ring ring-offset-2`.

### Transparency & blur
- Используются **минимально**. Backdrop-blur — только для модальных оверлеев и нижних tab-bar в iOS-стиле (если требуется).
- Нет «glassmorphism» как декоративного приёма.

### Imagery
- **Тёплая палитра** (Индия): мягкий warm light, без пересатурации.
- **Не cool/B&W/grain.** Цветная, но не кричащая.
- Для travel-photo — портретные ориентации в карточках, ландшафт для hero-блоков.
- Документы (паспорт/виза) показываются как scan-preview с лёгким border, без декоративных рамок.

### Layout rules
- **Mobile-first**, минимальный viewport — 360px (старые Android).
- SOS — **всегда виден** на главном экране Trip Dashboard, на других — floating bottom-right.
- Главный экран — карточная вертикальная компоновка: `Сейчас → Следующее → Quick actions → Кружок → SOS`.
- Container max-width на desktop: `2xl` (1536px), но реальный контент в Trip Dashboard ограничен `max-w-md` (мобильная компоновка).

### Iconography
- **Lucide React** — единственная icon-библиотека. Outline 24×24, stroke 2px, currentColor.
- Не миксовать с Heroicons / Phosphor / Tabler.
- Размеры: 16 / 20 / 24 / 32px.
- Эмодзи допустимы как UI-маркеры (см. CONTENT FUNDAMENTALS), но иконы предпочтительнее для интерактивных контролов.

---

## ICONOGRAPHY

**Базовая библиотека:** [Lucide](https://lucide.dev/) (`lucide-react`). В этом design system иконы загружаются с CDN: `https://unpkg.com/lucide-static@latest/icons/<name>.svg` — см. `assets/icons/`.

**Правила:**
- Outline only, stroke 2px, currentColor (наследует `--foreground`).
- Размеры: `w-4` (16px inline) / `w-5` (20px buttons) / `w-6` (24px nav) / `w-8` (32px hero).
- Icon-only кнопки — обязательный `aria-label`.
- Stroke не варьируется — везде 2px (1.5/2.5 не использовать).

**Кастомные иконы** (в коде проекта, ещё не реализованы):
- `IconSosShield` — для SOS-кнопки.
- `IconCircleRecord` — для recorder кружка.

**Эмодзи как маркеры:** 🇮🇳 (страна) · 📂 (документы) · 🗺️ (маршрут) · 💬 (concierge) · 📞 (гид) · 🆘 (SOS) · 🎬 (кружок) · ✅ (готово) · 📡 (нет сети) · ⚡ (быстрые действия). Используются ограниченно, в Trip Dashboard.

---

## Index / манифест

| Файл | Что внутри |
|---|---|
| `README.md` | Этот файл — content fundamentals, visual foundations, iconography |
| `colors_and_type.css` | CSS-переменные палитры + семантические type-классы |
| `SKILL.md` | Skill-определение для Claude Code / Agent Skills |
| `fonts/` | Inter (Google Fonts) — подгружается с CDN, локальная копия не требуется |
| `assets/icons/` | Lucide icon set + key brand emoji references |
| `assets/logo/` | IndiaHorizone wordmark / mark |
| `preview/` | HTML cards для Design System tab (type / colors / spacing / components / brand) |
| `ui_kits/trip_dashboard/` | UI-kit: Trip Dashboard mobile (главный экран, документы, кружок, SOS) |

### Источники
- **Repo:** [Rivega42/indiahorizone](https://github.com/Rivega42/indiahorizone) (main branch)
- **Design system doc:** `docs/UX/DESIGN_SYSTEM.md` в репо
- **Tokens (источник):** `apps/web/app/globals.css` + `apps/web/tailwind.config.ts`
- **Trip Dashboard ядро:** `docs/UX/FEATURES/CORE.md`
- **Кружок UX:** `docs/UX/VIDEO_CIRCLE.md`
