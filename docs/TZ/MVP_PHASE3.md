# MVP Phase 3 — что есть, что в работе, что следующее

> Закрывает [#92](https://github.com/Rivega42/indiahorizone/issues/92).
> Документ обновляется живьём по мере прогресса.
> Дата актуализации: **2026-04-28**.

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

### M5: «Кружок» Production + архитектура

**Backend M5 — практически завершён по состоянию на 2026-04-28** 🎉

Backend slices status:

| Slice | Что | Статус |
|---|---|---|
| **A** Bootstrap | Prisma + Redis + outbox + idempotency + pino + OTel + Prometheus | ✅ DONE |
| **B** Auth | register/login/JWT/refresh/logout/RBAC/2FA enroll+verify/password-reset/suspicious-detection | ✅ DONE (только #137 Playwright e2e ждёт frontend 2FA UI) |
| **C** Clients | Client + ClientProfile + AES-256-GCM encryption + GET/PATCH /me + Consent (4 типа granular) + EmergencyContact CRUD | ✅ DONE (только #141 passport ждёт media endpoints) |
| **D** Trips | Trip+Itinerary+DayPlan+Booking schema + POST /trips + itinerary versioning + publish + GET + status state-machine + payment listener + cron auto-transitions | ✅ DONE (#160, #361, #364) |
| **E** Comm | comm-svc base + email-провайдер + welcome + chat schema + REST + WebSocket gateway + notification preferences (4 категории) + suspicious-login email + **PushSubscription model + POST /comm/push/subscribe + LogPushProvider stub (#163 phase 1)** | 🟢 95% (real WebPushProvider ждёт VAPID #353) |
| **F** Media | MediaAsset schema + S3 client wrapper (R2/Beget/MinIO compatible) | 🟡 schema готов, endpoints (#174-178) ждут Beget creds (#350) |
| **G** Feedback | FeedbackRequest + Feedback schema + POST/GET endpoints + outbox event | ✅ DONE (только #189 AI signals enrichment ждёт LLM-флоу) |
| **K** Cross-cut | append-only audit log + admin GET /audit + rate-limit (4 профиля) + pino + OTel + Prometheus | 🟢 95% (только #220 Vault, #224 Grafana — devops) |

Всего за апрель 2026: **25+ PR'ов merged, 35+ issues закрыто, ~7000 строк production-кода**.

### Frontend (Tour Landing + onboarding) — 28 апреля 2026

| Что | Статус | Issue |
|---|---|---|
| `/tours/[slug]` route + ISR + generateStaticParams | ✅ DONE | #298 |
| Hero + Facts + DayTimeline + Inclusions + Reviews + PriceBlock + FAQ + FooterLegal — все секции | ✅ DONE (inline в page.tsx) | #299–#306 |
| LeadForm с consent чекбоксом ПДн | ✅ DONE | #304 |
| Catalog API `GET /tours` + `GET /tours/:slug` | ✅ DONE | #296 |
| SEO — Schema.org TouristTrip + FAQPage + Open Graph + Twitter + robots.txt + sitemap.xml + Yandex-verification | ✅ DONE | #308 |
| `/privacy` + `/consent` + `/offer` legal страницы (DRAFT, требуют юр.review) | ✅ DRAFT | #307 |
| Performance: next/image для hero+timeline, dynamic import LeadForm, AVIF/WebP | ✅ DONE | #309 (Lighthouse-замер ждёт deploy) |
| PWA manifest + Service Worker + iOS-friendly icons | ✅ DONE | #122 |
| iOS PWA push prompt (usePushSupport hook + IosInstallInstructions + EnableNotificationsButton) | ✅ DONE | #356 |
| Auth UI (login/register) | ✅ DONE | #135 |
| Дизайн D1-D7 для Tour Landing | ⏳ В работе (Claude Design) | #312–#318 |
| Trip Dashboard frontend | ⏳ Не начато | #152–#161 |
| 2FA enroll / chat UI | ⏳ Не начато | #170 |

### Что блокирует production

- **Email отправка**: ждёт credentials (#349 Mailgun**ER** / Yandex / Postmark) — пока работает в LogProvider stub
- **Media upload**: ждёт Beget Object Storage creds (#350)
- **Push notifications real delivery**: ждёт VAPID keys (#353 Firebase) — pipeline уже ready (LogPushProvider stub)
- **APNs / iOS native**: фаза 4 (требует Apple Developer $99/year)
- **Юридические тексты в /privacy /consent**: ждут юр.review (Roman + юрист)
- **Vault/KMS** (#220), **Grafana dashboards** (#224), **Lighthouse CI** — devops Вика

### M6: Growth & Optional
Программа лояльности (см. [`docs/LOYALTY/`](../LOYALTY/)), GDPR (если нужно), OpenAPI, traces, расширения дашборда (гайды/утилиты/соц/сервис).

### Закрытые в этой итерации каркасы

- [x] `docs/JTBD.md` — JTBD клиентов и команды (EPIC 1)
- [x] `docs/USER_STORIES.md` — INVEST-истории по ролям с приоритетами (EPIC 1)
- [x] `docs/LOYALTY/README.md`, `REFERRAL.md`, `REPEAT.md`, `UGC.md` — программа лояльности фазы 3 (EPIC 8, [#86](https://github.com/Rivega42/indiahorizone/issues/86))
- [x] `docs/BUSINESS_MODEL/UNIT_ECONOMICS.md` — каркас юнит-экономики ([#9](https://github.com/Rivega42/indiahorizone/issues/9))
- [x] `CLAUDE.md § 5, § 6` — принципы «документы — часть фичи» и «проактивные рекомендации»
- [x] `CONTRIBUTING.md` — PR-чеклист и шаблон с обязательным разделом зависимых документов

### M4 — Operations & Onboarding (закрыто в этой итерации)

- [x] `docs/OPS/GUIDE_ONBOARDING.md` — воронка найма, скрининг, интервью, тест-выезд, стажировка, аттестация, категории, расторжение
- [x] `docs/OPS/GUIDE_CHECKLISTS.md` — ежедневные SOP (pre-trip, аэропорт, утро, день, debrief, конец поездки, внештатные, аптечка)
- [x] `docs/LEGAL/CONTRACTS/GUIDE_CONTRACT.md` — договор IH IN PVT LTD ↔ гид (service contract, TDS, NDA, non-solicit)
- [x] `docs/LEGAL/CONSENTS/PHOTO_VIDEO.md` ([#53](https://github.com/Rivega42/indiahorizone/issues/53)) — granular 4 уровня
- [x] `docs/LEGAL/CONSENTS/GEO.md` ([#54](https://github.com/Rivega42/indiahorizone/issues/54)) — granular SOS / live / геофенс / аналитика
- [x] `docs/LEGAL/CONSENTS/EMERGENCY_CONTACTS.md` ([#55](https://github.com/Rivega42/indiahorizone/issues/55)) — двойное согласие, регламент звонка

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
