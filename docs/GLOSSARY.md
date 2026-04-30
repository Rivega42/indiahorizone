# Глоссарий

> Доменные термины IndiaHorizone. Если встретили незнакомое слово в коде / docs — сюда.

## A

- **AAA, AAAA records** — DNS-записи (Vика). IPv4 / IPv6 для хоста.
- **ADR** (Architecture Decision Record) — формат записи архитектурных решений. См. `DECISIONS.md`.
- **AML** — Anti-Money Laundering. Финансовые флаги для крупных транзакций (Россия + Индия требования).
- **APNs** — Apple Push Notification service. Для native iOS-приложений (фаза 4).
- **Append-only** — таблица где UPDATE/DELETE запрещены через trigger. Используется для audit log (#218).
- **Argon2id** — алгоритм хеширования паролей (наш выбор для phase 3+).

## B

- **Backwaters** — каналы / лагуны Кералы. Главная природная достопримечательность для Tour Кералы.
- **Backlog** — список задач не в текущем спринте. См. `BACKLOG.md`.
- **Bandit** — security-static-analyzer для Python (не используется, мы TypeScript).
- **BFG** — инструмент для cleanup git history (удаление случайно закомиченных секретов).
- **Brokered transfer** — перевод с RU на IN через банк-посредник в нейтральной стране (Армения / ОАЭ).

## C

- **Catalog domain** — модуль управления Tour'ами (витрина) vs Trips (конкретная бронь). См. `docs/ARCH/CATALOG.md`.
- **CIRCLES** — стратегический блок про видео-кружки (см. `docs/STRATEGY/`).
- **Concierge** — поддержка клиентов 24/7. Сейчас 1 человек (Шивам), цель phase 3 — 2+ (#278).
- **Concurrent groups** (Redis Streams) — механизм для подписки нескольких consumers на один stream.
- **Consent** — согласие клиента на обработку ПДн. У нас 4 типа granular (photo_video / geo / emergency_contacts / marketing).
- **Cross-border transfer** — передача ПДн в страну без adequate protection. Индия не в списке → требует explicit consent (152-ФЗ ст. 12).
- **CSP** (Content Security Policy) — HTTP-header для XSS защиты.

## D

- **DMC** (Destination Management Company) — компания на земле, организует наземное обслуживание. Партнёр в Индии — IndiaHorizone IN PVT LTD.
- **DPO** (Data Protection Officer) — назначенный человек по 152-ФЗ (компания > определённого размера). На phase 3 — Roman формально.

## E

- **EPIC** — крупный блок работ из 3+ issues. См. CLAUDE.md § 8.
- **Event Bus** — Redis Streams в phase 3 → NATS/Kafka в phase 4-5.
- **Event-driven architecture** — модули общаются через bus events, а не прямые calls.

## F

- **FCM** (Firebase Cloud Messaging) — Google's push delivery. Для Web Push мы НЕ используем Firebase (W3C standard сам роутит через FCM прозрачно).

## G

- **gen_random_uuid()** — Postgres function для UUID v4. Используем как DEFAULT в id columns (см. ADR-005).
- **gitleaks** — secret-scanner для git history. Будет использоваться через CI workflow + Vика manual run.
- **Granular consent** — отдельные согласия по типам, не один blanket-checkbox. У нас 4 типа.
- **GraphQL** (GitHub) — используем для automation scripts (см. `scripts/automation/lib/graphql.mjs`).

## H

- **Houseboat** — лодка-домик в Backwaters Кералы. Главная активность в туре Кералы.

## I

- **Idempotency** — операция, которую можно повторить без побочных эффектов. Через `processed_events` для event-consumers + `Idempotency-Key` header для POST requests.
- **Itinerary** — версионированный маршрут конкретной поездки (отличается от Tour-template). DRAFT → PUBLISHED.

## J

- **JTBD** (Jobs To Be Done) — фреймворк user-research'а. См. `docs/JTBD.md`.
- **JWT** (JSON Web Token) — наш auth-токен (15-мин access + 30-дн refresh).

## L

- **LCP** (Largest Contentful Paint) — Core Web Vitals метрика. Цель ≤ 2.5s. Для tour landing — hero image.
- **Lead** — заявка с формы / сообщения, до создания Trip (Sales funnel первый этап).
- **legal review** — обязательный шаг для legal-text'ов перед публикацией (наш юрист).
- **Lighthouse** — Google инструмент для аудита performance / a11y / SEO. Workflow в #309/#384.

## M

- **Modular monolith** — наша архитектура phase 3 (один deployable, строгие модули).
- **Modularity rules** — cross-module FK запрещены, общение через bus или явные SDK adapters.

## O

- **Outbox pattern** — запись событий в БД-таблицу в той же транзакции что и бизнес-операция. Outbox-relay воркер потом публикует в bus. Гарантия "не потеряется" + "не дублируется".

## P

- **PII** (Personally Identifiable Information) — персональные данные. У нас — firstName, lastName, dateOfBirth, phone (encrypted via AES-GCM).
- **Privacy-by-default** — events / logs / outbox по умолчанию НЕ содержат PII. Сознательно whitelist'ить только non-sensitive поля.
- **Project v2** — новый GitHub Projects (vs legacy boards). Используем для единого dashboard.
- **Push subscription** — W3C-сущность от browser.pushManager.subscribe. У нас — `PushSubscription` Prisma модель.

## R

- **RBAC** (Role-Based Access Control) — авторизация по ролям. У нас 6 ролей (см. `CLAUDE.md`).
- **Redis Streams** — наш event bus в phase 3 (см. ADR-002).
- **Refresh token rotation** — каждое использование refresh-токена создаёт новый и инвалидирует старый. Защита от replay.
- **revalidate** (Next.js) — ISR (Incremental Static Regeneration). У нас 3600s = 1 час для tour pages + sitemap.

## S

- **Schema.org TouristTrip** — JSON-LD тип для туров. Яндекс/Google понимают для rich snippets.
- **Service Worker** — JS-runtime в browser для push handling, app-shell cache. Файл `apps/web/public/sw.js`.
- **Shadow database** — temp DB для prisma migrate diff (вычисление дрейфа схемы).
- **Slug** — URL-сегмент (`tury-kerala-oktyabr-2026`). РУ-транслит + сезон. Critical для SEO.
- **SOS** — экстренный канал клиент → concierge. SLA 60 сек день / 3 мин ночь.
- **Squash merge** — merge стратегия (один PR = один коммит в main). Наш default.
- **Standalone mode** (PWA) — display: 'standalone' в manifest. Обязательно для iOS Web Push (Apple requirement).

## T

- **TDS** (Tax Deducted at Source) — индийский налог на платежи нерезидентам. Партнёр IN PVT LTD платит 10-30% при оплате гидам / нерезидентам.
- **Templating** (Handlebars) — рендер email templates с переменными (welcome / password-reset / suspicious-login).
- **TouristTrip** — Schema.org тип для тура (см. SEO).
- **Trip** — конкретная бронь конкретного клиента (vs Tour = template).

## U

- **UGC** (User-Generated Content) — отзывы клиентов, видео-кружки, фото. См. `docs/LOYALTY/UGC.md`.

## V

- **VAPID** (Voluntary Application Server Identification) — keypair для аутентификации нашего сервера в Web Push protocol. RFC 8292.
- **Vault** — HashiCorp Vault или эквивалент. Для production secrets (#220, не настроен в phase 3).
- **Vика** — DevOps AI-агент в OCPlatform. См. `docs/ai/VIKA_RULES.md`.

## W

- **Web Push** — W3C standard для push в браузерах + iOS PWA. Без Firebase. См. ADR-006.
- **WebPushProvider** — наш implementation в `apps/api/src/modules/comm/push/web-push.provider.ts`.
- **Workspaces** (pnpm) — monorepo механизм. У нас `apps/*` + `packages/*`.

## Y

- **Yandex.Webmaster** — RU SEO-инструмент. После prod-launch'а нужно подключить домен (Vика).
- **Yandex Cloud / Object Storage** — кандидат для S3 (152-ФЗ требует данные на РФ-серверах).

## 152-ФЗ

Российский закон «О персональных данных». Главное:
- **ст. 12** — трансграничная передача ПДн в страны без adequate protection (Индия не в списке) требует explicit consent.
- **ст. 14** — права субъекта ПДн (доступ / уточнение / удаление). Запросы на privacy@indiahorizone.ru.
- **ст. 18** — маркетинговые коммерческие коммуникации = opt-in (по умолчанию выключено).
- **ст. 18.1-18.5** — Localization (хранение на серверах в РФ).
