# Changelog

Все значимые изменения IndiaHorizone monorepo.

Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/).
Версионирование — [SemVer](https://semver.org/lang/ru/) после первого production-launch'а. Сейчас pre-1.0 → отслеживаем по date-stamps.

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
