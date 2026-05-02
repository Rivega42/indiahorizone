# Changelog

Все значимые изменения IndiaHorizone monorepo.

Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/).
Версионирование — [SemVer](https://semver.org/lang/ru/) после первого production-launch'а. Сейчас pre-1.0 → отслеживаем по date-stamps.

## 1.0.0 (2026-05-02)


### Features

* **audit:** append-only wildcard subscriber на все domain events ([#218](https://github.com/Rivega42/indiahorizone/issues/218)) ([31b9bbd](https://github.com/Rivega42/indiahorizone/commit/31b9bbde1e60b6d2577bc7b643c9120b6d9fa3ab))
* **audit:** GET /audit admin endpoint с cursor-pagination ([#219](https://github.com/Rivega42/indiahorizone/issues/219)) ([2ce8b52](https://github.com/Rivega42/indiahorizone/commit/2ce8b527da2500021cbe4493a47705133d2a6e94))
* **auth:** 2FA TOTP enrollment + verify при login + recovery codes ([#132](https://github.com/Rivega42/indiahorizone/issues/132), [#133](https://github.com/Rivega42/indiahorizone/issues/133)) ([9fbdf88](https://github.com/Rivega42/indiahorizone/commit/9fbdf881f1c73ef642ed771909bced51fb0ebf5f))
* **auth:** password reset через email + invalidate-all-sessions ([#134](https://github.com/Rivega42/indiahorizone/issues/134)) ([1016b10](https://github.com/Rivega42/indiahorizone/commit/1016b1014e8eb949061e10ec88f6fcb42b81a1e1))
* **clients:** полный домен — /me + Consent + EmergencyContact + endpoints ([#140](https://github.com/Rivega42/indiahorizone/issues/140), [#142](https://github.com/Rivega42/indiahorizone/issues/142), [#143](https://github.com/Rivega42/indiahorizone/issues/143), [#144](https://github.com/Rivega42/indiahorizone/issues/144)) ([0e270c2](https://github.com/Rivega42/indiahorizone/commit/0e270c2277d0ab0e2e8801aa94df50f5da2675ab))
* **comm,web:** push preferences + /profile/notifications + tour seed README ([e207474](https://github.com/Rivega42/indiahorizone/commit/e207474b3af889695e9017b5dc81f1219994dcaf))
* **comm:** chat REST endpoints с Idempotency-Key ([#169](https://github.com/Rivega42/indiahorizone/issues/169)) ([0366b36](https://github.com/Rivega42/indiahorizone/commit/0366b36b1effa8f0e072afdd156edc4223c122e8))
* **comm:** ChatThread + ChatMessage Prisma модели ([#167](https://github.com/Rivega42/indiahorizone/issues/167)) ([eb255c7](https://github.com/Rivega42/indiahorizone/commit/eb255c7b204de57ae603ec991ab9c9455814dbdd))
* **comm:** complete push API — DELETE/GET endpoints + NotifyService.sendPush() ([#163](https://github.com/Rivega42/indiahorizone/issues/163) phase 2) ([#375](https://github.com/Rivega42/indiahorizone/issues/375)) ([f742f33](https://github.com/Rivega42/indiahorizone/commit/f742f33add573bc350bde5533a070ac7fd3db75d))
* **comm:** high-urgency push для SOS / action-required ([#163](https://github.com/Rivega42/indiahorizone/issues/163) follow-up) ([cae2666](https://github.com/Rivega42/indiahorizone/commit/cae26665c38eaf5e0a830a2ad337b53e6097c3d4))
* **comm:** notification base + email-провайдер + welcome listener ([#162](https://github.com/Rivega42/indiahorizone/issues/162)) ([f0a4846](https://github.com/Rivega42/indiahorizone/commit/f0a4846f6d4c65da22997b6107252e1955c3d865))
* **comm:** notification subscriptions / preferences ([#166](https://github.com/Rivega42/indiahorizone/issues/166)) ([b58fb6c](https://github.com/Rivega42/indiahorizone/commit/b58fb6c23e2a2dc0a011942cc7afdbd09c6d2cda))
* **comm:** NotifyService.send() respects email preferences ([#166](https://github.com/Rivega42/indiahorizone/issues/166) parity) ([bb6ae0c](https://github.com/Rivega42/indiahorizone/commit/bb6ae0c5a8ada0a6a2f3c86f6fc76cd269e5c9c4))
* **comm:** push backend foundation — PushSubscription + POST /comm/push/subscribe ([#163](https://github.com/Rivega42/indiahorizone/issues/163) phase 1) ([ce0f911](https://github.com/Rivega42/indiahorizone/commit/ce0f911d2ece38bcb67744081778c35287faf7cf))
* **comm:** WebPushProvider через web-push npm — VAPID-based real delivery ([#163](https://github.com/Rivega42/indiahorizone/issues/163)) ([#376](https://github.com/Rivega42/indiahorizone/issues/376)) ([d4c58cd](https://github.com/Rivega42/indiahorizone/commit/d4c58cd6f48de6dd3e8a51bf0c801e405f6f840d))
* **comm:** WebSocket gateway для realtime chat ([#168](https://github.com/Rivega42/indiahorizone/issues/168)) ([c4ccd49](https://github.com/Rivega42/indiahorizone/commit/c4ccd49a589830073f21e72dcafd4776818c3aa2))
* **db:** add Prisma migrations — 0_init (OutboxEntry + ProcessedEvent) ([eac7a59](https://github.com/Rivega42/indiahorizone/commit/eac7a59395b38a7752499870d9299f83d6d1bd83))
* **feedback:** FeedbackRequest + Feedback Prisma модели ([#186](https://github.com/Rivega42/indiahorizone/issues/186)) ([9b065cc](https://github.com/Rivega42/indiahorizone/commit/9b065cc1b7ecda286c3e610e462d6a44b4cbabb4))
* **feedback:** POST /feedback + GET /trips/:id/feedbacks ([#188](https://github.com/Rivega42/indiahorizone/issues/188)) ([f5e3f4a](https://github.com/Rivega42/indiahorizone/commit/f5e3f4a91b0fda7fa9fe0a4b8f4214685af18086))
* **media:** MediaAsset model + S3 client wrapper ([#173](https://github.com/Rivega42/indiahorizone/issues/173)) ([455df35](https://github.com/Rivega42/indiahorizone/commit/455df354125fd56a2617ee414dfa010a7f693d85))
* **observability:** OpenTelemetry traces + auto-instrumentation ([#223](https://github.com/Rivega42/indiahorizone/issues/223)) ([47d6b04](https://github.com/Rivega42/indiahorizone/commit/47d6b0458b3748f3a3a471f229489259b5b25584))
* **profile,auth:** A-11 + A-12 — Daily feedback + Password reset ([#534](https://github.com/Rivega42/indiahorizone/issues/534)) ([a004a78](https://github.com/Rivega42/indiahorizone/commit/a004a78d506ef5be9154ef82a0c73af4257635dc))
* **profile:** A-01 + A-06 + A-07 + A-08 — FE подключение клиентского кабинета ([#532](https://github.com/Rivega42/indiahorizone/issues/532)) ([e16ae1d](https://github.com/Rivega42/indiahorizone/commit/e16ae1d0c2b3f2babac339fccdc250f860c5045a))
* **profile:** A-02 + A-09 + A-10 — PII edit, trip detail, chat UI ([#533](https://github.com/Rivega42/indiahorizone/issues/533)) ([11a289a](https://github.com/Rivega42/indiahorizone/commit/11a289a98ef5c69939f7dc8907078ed047ca598e))
* **profile:** A-13 Trip Dashboard + меню профиля расширено ([#535](https://github.com/Rivega42/indiahorizone/issues/535)) ([f408590](https://github.com/Rivega42/indiahorizone/commit/f408590ea1c8868ea3ceb7c4f5a77a2afc4d6356))
* **security:** rate-limit на gateway через @nestjs/throttler + Redis ([#221](https://github.com/Rivega42/indiahorizone/issues/221)) ([a578714](https://github.com/Rivega42/indiahorizone/commit/a578714a1c0324df8e9e729afe244e04ba1d1dac))
* **security:** suspicious-login detection + email алерт ([#136](https://github.com/Rivega42/indiahorizone/issues/136)) ([6514927](https://github.com/Rivega42/indiahorizone/commit/651492727188c519f0376265c741c169e87f2315))
* **trips:** cron auto-transitions paid→in_progress→completed ([#160](https://github.com/Rivega42/indiahorizone/issues/160)) ([2a841af](https://github.com/Rivega42/indiahorizone/commit/2a841af8b2da73cb93762d0436520c129b050863))
* **trips:** GET /trips/me + GET /trips/:id с RBAC ([#361](https://github.com/Rivega42/indiahorizone/issues/361)) ([ee151a4](https://github.com/Rivega42/indiahorizone/commit/ee151a4db6bd7fdceb263167e96ff50286426566))
* **trips:** itinerary versioning + publish + GET ([#151](https://github.com/Rivega42/indiahorizone/issues/151)) ([2dfb23c](https://github.com/Rivega42/indiahorizone/commit/2dfb23c30305884fdd7277b8198f1a4a6533dcdc))
* **trips:** Trip + Itinerary + DayPlan + Booking + POST /trips ([#149](https://github.com/Rivega42/indiahorizone/issues/149), [#150](https://github.com/Rivega42/indiahorizone/issues/150)) ([f735b76](https://github.com/Rivega42/indiahorizone/commit/f735b7627201ffae75afa005e88c5ef63341145a))
* **trips:** trip status state-machine + PATCH /status + payment listener ([#160](https://github.com/Rivega42/indiahorizone/issues/160)) ([8d064c2](https://github.com/Rivega42/indiahorizone/commit/8d064c2835f967e7ffc7883169be2d80c7239dcd))
* **web:** /tours index + /profile index pages + upcoming teaser ([b720290](https://github.com/Rivega42/indiahorizone/commit/b72029048d422e39c8394db5ffd7a2495f98e037))
* **web:** iOS PWA push prompt + EnableNotificationsButton ([#356](https://github.com/Rivega42/indiahorizone/issues/356)) ([10f8d10](https://github.com/Rivega42/indiahorizone/commit/10f8d103fdc7262d906ab4760d2ddc4ddf1b729b))
* **web:** SEO — Schema.org TouristTrip + FAQPage + OG + robots/sitemap ([#308](https://github.com/Rivega42/indiahorizone/issues/308)) ([6e937ca](https://github.com/Rivega42/indiahorizone/commit/6e937ca6e267d5d759232f407658ebcb8dd40f23))
* **web:** импорт homepage прототипа + страница тура «Керала» (live preview) ([#319](https://github.com/Rivega42/indiahorizone/issues/319)) ([3f16619](https://github.com/Rivega42/indiahorizone/commit/3f1661973dc4ce09501a79e74d6ffc3a99d47a56))
* **web:** подключить страницу тура и LeadForm к backend API ([#327](https://github.com/Rivega42/indiahorizone/issues/327)) ([25bd5ee](https://github.com/Rivega42/indiahorizone/commit/25bd5ee4709a1a4b0ec1bafff44e24139b2087ba))


### Bug Fixes

* **db:** hotfix — missing sessions table migration (M5.B.003) ([c2d3bf7](https://github.com/Rivega42/indiahorizone/commit/c2d3bf7d558f8ed706b2e39df4d8c5b56d0db04c))
* **deploy:** build Docker image in GHA → push to GHCR (fix timeout) ([#378](https://github.com/Rivega42/indiahorizone/issues/378)) ([a2829cf](https://github.com/Rivega42/indiahorizone/commit/a2829cf4d86f2526d7df070fc7741016855370e5))
* **deploy:** unblock api+web Docker runtime + seed admin ([#326](https://github.com/Rivega42/indiahorizone/issues/326), [#328](https://github.com/Rivega42/indiahorizone/issues/328), [#330](https://github.com/Rivega42/indiahorizone/issues/330)) ([9426904](https://github.com/Rivega42/indiahorizone/commit/942690472a32625808fbf9c87e41b4940f621172))


### Performance Improvements

* **web:** next/image для hero+timeline, dynamic LeadForm ([#309](https://github.com/Rivega42/indiahorizone/issues/309)) ([3f927f2](https://github.com/Rivega42/indiahorizone/commit/3f927f2c8ae0efcb403bcfea41bb9feca9a4b4cc))

## [Unreleased]

### Added
- `chore/repo-setup` PR — применение `repo-setup-kit`: STATE.md, DECISIONS.md, SECURITY.md, CHANGELOG.md, ROADMAP.md (root facade), BACKLOG.md (root facade), AUDIT.md, `docs/ai/` (CLAUDE/Vika/DevOps rules), `scripts/automation/*`, дополнительные ISSUE_TEMPLATE'ы (epic/task/tech_debt/vika_devops), 8 automation workflows.

## 2026-04-29 — Tour Catalog UX completion

### Added
- `/tours` index — каталог всех туров с card-grid (responsive 1/2/3-col), ISR, sitemap entry. Upcoming-teaser placeholder cards (PR #385).
- `/profile` index + `/profile/notifications` — preferences UI (4 категории × 4 канала) + devices management (PR #381).
- Push API completion: `DELETE /comm/push/subscribe` + `GET /comm/push/subscriptions` + `NotifyService.sendPush()` (PR #375).
- `WebPushProvider` через `web-push` npm — real Web Push delivery без Firebase. VAPID keys в env (PR #376).
- High-urgency push для SOS/action-required: `urgency: 'normal' | 'high'` с adjusted TTL (PR #382).
- iOS PWA push prompt: `usePushSupport()` hook, `IosInstallInstructions`, `EnableNotificationsButton` (PR #366).
- Push backend foundation: `PushSubscription` Prisma модель + `LogPushProvider` stub (PR #371).
- Push preferences integration в `NotifyService.sendPush()` + `.send()` — uses `category` для opt-in compliance (PR #381 + #383).
- Lighthouse CI workflow + budgets (`.lighthouserc.json`, weekly schedule + manual trigger) (PR #384).
- SEO Schema.org TouristTrip + FAQPage + Open Graph + sitemap.xml + robots.txt + Yandex-verification (PR #367).
- Legal pages `/privacy` + `/consent` + `/offer` (DRAFT) — 152-ФЗ compliance с cross-border consent (PR #368).
- Component extraction: tour landing разбит на `components/tour/{Hero,Facts,DayTimeline,...}.tsx` (PR #377).
- Performance: `next/image` для hero+timeline, dynamic import `LeadForm`, AVIF/WebP delivery (PR #370).
- `docs/ARCH/CATALOG.md`, `docs/UX/TOUR_LANDING.md` — domain documentation (PR #374).

### Changed
- Trip status state-machine: cron auto-transitions `paid → in_progress → completed` через `@nestjs/schedule` (PR #364).
- Prisma schema ↔ migrations zero-drift cleanup: `@default(uuid())` → `@default(dbgenerated("gen_random_uuid()"))` × 25, `participants/attachments String[] → @db.Uuid`, `notification_preferences.channels @default([])`. Plus `prisma-check.yml` workflow исправлен с `--shadow-database-url` (PR #373).
- Tour seed: auto-discovery всех `*.json` в `seed/tours/` (нет нужды модифицировать `TOUR_FILES` массив) + README для founder'а (PR #381).
- `EVENTS.md`: `trips.status.changed` ⏳ → ✅ done с reason'ами; добавлен `comm.push.subscribed` (PR #374).
- Lint+prettier cleanup across monorepo (CI green) (PR #365).

### Fixed
- `notify.service.ts` `Prisma.InputJsonValue` cast (build error fix in #365).

## 2026-04-28 — Backend M5 завершён

### Added
- M5.D Trips: state-machine + payment listener + GET /trips/me + GET /trips/:id RBAC (#160, #361).
- M5.E Comm: notification preferences (#166), chat REST + WebSocket gateway (#167-#169), push backend foundation (#163).
- M5.G Feedback: FeedbackRequest + Feedback модели + POST/GET endpoints + outbox (#188).
- M5.K Cross-cut: append-only audit log (#218), admin GET /audit (#219), rate-limit profiles (#221).

## 2026-04-26..27 — Backend M5 slices A-C

### Added
- M5.A Bootstrap: Prisma + Redis + outbox + idempotency + pino + OTel + Prometheus.
- M5.B Auth: register/login/JWT/refresh/logout/RBAC/2FA enroll+verify/password-reset/suspicious-detection.
- M5.C Clients: Client + ClientProfile + AES-256-GCM encryption + GET/PATCH /me + Consent (4 типа granular) + EmergencyContact CRUD.

## 2026-04-25 — Phase 3 Bootstrap

### Added
- Repo scaffold: pnpm workspaces, Prisma init, Next.js + NestJS skeletons.
- ТЗ + ARCH + USER_STORIES + JTBD documentation (EPIC 1).
- ISSUE_TEMPLATE / pull_request_template / config / labels.
- CI workflows (Lint+Format+Type-check+Tests).

---

## Будущие записи

При merge каждого feature-PR'а — добавляем строку в раздел `[Unreleased]`. При release — переносим `[Unreleased]` в новый раздел с датой / версией.

Когда подключим **release-please** workflow (см. ROADMAP.md), CHANGELOG будет генерироваться автоматически из Conventional Commits.
