# IndiaHorizone — Roadmap

> **Статус:** Draft v0.1, утверждён founders 2026-04-25.
> **Owner:** Roman.
> Полная декомпозиция issues по эпикам и неделям. Дополнение к [`docs/TZ/MVP_PHASE3.md`](TZ/MVP_PHASE3.md) и [`docs/BACKLOG/M5/README.md`](BACKLOG/M5/README.md).

## Точка отсчёта

- **2026-04-25** — старт исполнения backlog M5, ветка `claude/continue-roadmap-rfG4L` смержена в main.
- **Wave 0–2 уже закрыты:** 6 issues (#111–#116, #121), ~30 часов работы.
- **Команда:** допущение «1 dev fullstack, 7 рабочих часов в день, 5 дней в неделю». Корректируется по факту.
- **Реальные оценки** — см. [`docs/BUSINESS_MODEL/UNIT_ECONOMICS.md`](BUSINESS_MODEL/UNIT_ECONOMICS.md). Эта Roadmap — рабочий план, не контракт.

## Целевые milestones

| Milestone | Дата | Что включает |
|---|---|---|
| **M5 Wave 2** ✅ | 2026-04-25 | Bootstrap + CI + NestJS + Next.js scaffolds (#111–#116, #121) |
| **M5 Slice A finish** | 2026-05-08 | Backend infra: Prisma + Redis events-bus + outbox + idempotency + observability baseline |
| **MVP-1: первая регистрация** | 2026-05-22 | Auth + Trip Dashboard ядро без offline. Можно показать первому клиенту регистрацию + базовый дашборд |
| **MVP-2: «реально работающий продукт»** | 2026-06-26 | Кружок + SOS + чат + полный offline-first Trip Dashboard. Можно ставить настоящему клиенту в Индии |
| **MVP-3: финансы и операции** | 2026-07-17 | Оплата онлайн + панель гида + AML + inter-co учёт |
| **Production-ready** | 2026-07-31 | Cross-cutting (audit/secrets/observability/deploy/security), staging+prod deployable |

## Иерархия

Все 118 M5-issues привязаны как **native sub-issues** к одному из 10 эпиков по тематике. Принцип — см. [`CLAUDE.md` § 8](../CLAUDE.md). Mapping ниже.

## Mapping issues → эпики

### EPIC 1 — Документация продукта (#1) — closed

Закрыт. JTBD/USER_STORIES/BUSINESS_MODEL — в [`docs/JTBD.md`](JTBD.md), [`docs/USER_STORIES.md`](USER_STORIES.md), [`docs/BUSINESS_MODEL.md`](BUSINESS_MODEL.md).

### EPIC 2 — Платежи и финансы (#11) — open

Старые: `#12 (closed)`, `#13–#18`. **+9 M5 issues:**
- Slice I (Finance baseline): `#202–#210`

### EPIC 3 — SOS (#19) — open

Старые: `#20 (closed)`, `#21 (closed)`, `#22–#30`. **+10 M5 issues:**
- Slice H (SOS production): `#192–#201`

### EPIC 4 — Операционные обязательства (#31) — open

Старые: `#32 (closed)`, `#33–#46`. **+11 M5 issues:**
- Ops-events: `#159` (push 2ч/30мин), `#187` (feedback-scheduler), `#189` (negative-detection), `#191` (NPS post-trip)
- Slice J (Catalog + панель гида): `#211–#217`

### EPIC 5 — Юридика и compliance (#47) — open

Старые: `#48 (closed)`, `#49–#56`. **+10 M5 issues:**
- ПДн/Consent code: `#139` (column-encryption), `#141` (паспорт + 2FA), `#142–#143` (Consent + endpoints), `#144` (emergency contacts), `#145` (retention), `#146` (DSAR), `#148` (e2e ПДн)
- Cross-compliance: `#222` (IndexedDB encryption), `#228` (pen-test + vuln scan)

### EPIC 6 — Архитектура modular monolith → микросервисы (#57) — open

Старые: `#58–#76`. **+~52 M5 issues** (backend infra и data):
- **Slice A backend:** `#115` (docker-compose), `#116–#120` (NestJS + Prisma + Redis + outbox + idempotency), `#124–#125` (Pino + Prometheus)
- **Slice B Auth целиком:** `#126–#137` (12 issues)
- **Slice C backend:** `#138` (Client модель), `#140` (/clients/me API)
- **Slice D backend:** `#149–#151` (Trip + Itinerary + versioning), `#160` (status-machine)
- **Slice E backend:** `#162–#169` (notify base + push + SMS + Telegram + preferences + чат модели/WS/REST), `#171–#172` (rate-limit + e2e)
- **Slice F backend:** `#173–#178` (MediaAsset + S3 + presigned + finalize + транскод + signed URL + retention)
- **Slice G backend:** `#186` (Feedback модели), `#188` (feedback API)
- **Slice K backend:** `#218–#221` (audit + Vault/KMS + rate-limit), `#223–#224` (OpenTelemetry + Grafana)

### EPIC 7 — UX и фичи (#77) — open

Старые: `#78 (closed)`, `#79–#85`. **+22 M5 issues** (frontend):
- **Slice A frontend:** `#121` (Next.js scaffold), `#122` (PWA), `#123` (React Query)
- **Slice C frontend:** `#147` (web профиль/согласия)
- **Slice D frontend:** `#152–#158` (today API + documents API + главный экран + документы UI + маршрут UI + offline cache + Mapbox), `#161` (e2e)
- **Slice E frontend:** `#170` (чат UI)
- **Slice F frontend:** `#179–#185` (recorder + сжатие + очередь + chunked upload + playback + дневник + e2e)
- **Slice G frontend:** `#190` (экран фидбэка)

### EPIC 8 — Программа лояльности (#86) — open

Существующие: `#87`, `#88` (документация). Code-issues пока нет — реферальная UI / repeat-привилегии — фаза 4 после первых ~50 поездок.

### EPIC 9 — ТЗ v1.0 (#89) — open

Старые: `#90`, `#91`, `#92`, `#109`. M5-issues не привязываются (это мета-эпик документации).

### EPIC 10 — Гигиена репозитория (#93) — open

Старые: `#94 (closed)`, `#95–#100`. **+7 M5 issues:**
- Repo + CI: `#111` (workspaces), `#112` (TS), `#113` (ESLint), `#114` (CI)
- Deploy: `#225` (staging), `#226` (production), `#227` (backup + DR)

## Timeline по неделям (W18 2026 → W31 2026)

```
W18  Apr 28-May 01  ✅ Wave 0+1+2 (#111-116, #121)             [DONE]
W19  May 04-May 08  Slice A finish: #117 #118 #119 #120        Backend infra
                    #122 #123 #124 #125
W20  May 11-May 15  Slice B Auth: #126 #127 #128 #129 #130     Auth
                    #131 #132 #133
W21  May 18-May 22  Slice B finish: #134 #135 #136 #137         Auth UI
                    + Slice E.1: #162 (email comm)             ⭐ MVP-1
W22  May 25-May 29  Slice C Clients/ПДн: #138 #139 #140 #141    Compliance
                    #142 #143 #144
W23  Jun 01-Jun 05  Slice C finish: #145 #146 #147 #148         Compliance UI
                    + Slice E push/sms: #163 #164 #165 #166
W24  Jun 08-Jun 12  Slice E чат: #167 #168 #169 #170 #171 #172   Comm + чат
                    + Slice D backend: #149 #150 #151 #152 #153
W25  Jun 15-Jun 19  Slice D frontend: #154 #155 #156 #157 #158   Trip Dashboard
                    + Slice D ops: #159 #160 #161
W26  Jun 22-Jun 26  Slice F кружок: #173-#178 (backend)         Кружок + дневник
                    #179-#185 (frontend)                        ⭐ MVP-2
W27  Jun 29-Jul 03  Slice G Feedback: #186-#191                  Feedback + SOS
                    + Slice H SOS: #192-#196 (backend)
W28  Jul 06-Jul 10  Slice H SOS finish: #197-#201               SOS UI
                    + Slice I Finance start: #202-#206
W29  Jul 13-Jul 17  Slice I Finance finish: #207-#210            Finance + Catalog
                    + Slice J Catalog: #211-#217                ⭐ MVP-3
W30  Jul 20-Jul 24  Slice K observability: #218-#224             Audit + obs
W31  Jul 27-Jul 31  Slice K deploy: #225-#228                    ⭐ Production
```

## Critical path

`#111 → #112 → #116 → #117 → #118 → #119 → #120` — backend инфра (Wave 0–1, ~7 рабочих дней).
После этого открываются параллельные потоки: Auth, Clients, Trips, Comm.

> **Рекомендация:** при найме второго dev — параллельно вести **frontend (EPIC 7)** и **backend (EPIC 6)**. Frontend ждёт API-моков, что синхронизируется через `docs/ARCH/MICROSERVICES.md` § API. Это экономит ~40% wall-clock времени на M5.

## MVP-1 acceptance (W21, 22 May 2026)

Минимум для демо первому клиенту:
- [ ] Регистрация и login работают (`#126–#137`)
- [ ] Профиль клиента + базовая ПДн-форма (`#138`, `#140`)
- [ ] Trip Dashboard главный экран с моковой поездкой (`#149`, `#150`, `#152`, `#154`)
- [ ] Email уведомления приходят (`#162`)

> **Признак провала MVP-1:** клиент не может пройти полный сценарий «регистрация → увидеть свою поездку → получить email» без support'а.

## MVP-2 acceptance (W26, 26 Jun 2026)

Минимум для отправки клиента в Индию:
- [ ] MVP-1 функциональность
- [ ] Полная offline-first Trip Dashboard (документы, маршрут, карты)
- [ ] Кружок: запись + отправка + дневник
- [ ] SOS hold-to-trigger + ack дежурным concierge
- [ ] Чат клиент↔concierge realtime + offline outbox
- [ ] Push 2ч и 30мин до события

## MVP-3 acceptance (W29, 17 Jul 2026)

Полный коммерческий продукт:
- [ ] MVP-2 функциональность
- [ ] Платежи онлайн (или manual confirm) + AML базовый
- [ ] Inter-co учёт РФ↔IN
- [ ] Панель гида: смена + клиенты + фото-загрузка + расходы
- [ ] Feedback ежедневный + NPS post-trip

## Production-ready (W31, 31 Jul 2026)

Готов к боевой эксплуатации:
- [ ] MVP-3 функциональность
- [ ] Audit-log на всех событиях
- [ ] Secrets через Vault / KMS
- [ ] Staging + production deployment
- [ ] Backup + DR-drill пройден
- [ ] Pen-test базовый зелёный

## GitHub Project Roadmap view

> **Серверная часть** — настройка нативного Project view с Gantt-визуализацией. Делается Викой по issue [`[devops:vika] GitHub Project Roadmap setup`](#TBD). После настройки — все issues видны в Roadmap view с привязкой к датам.

Custom fields в Project:
- `Slice` — A..K
- `Wave` — 0..3
- `Start date`, `Target date` — по неделям из таблицы выше
- `Priority` — P0/P1/P2 (из title)
- `Owner-role` — backend/frontend/devops/qa

Views:
- **Roadmap** — Gantt по `Start date / Target date`, группировка по Slice
- **Board** — kanban по статусу
- **Table** — flat с фильтрами

## Корректировки

Roadmap живой. После каждого закрытого slice — обновляем актуальные даты, переносим скользящие. Любой PR со значимым отклонением (>3 рабочих дней) — обновляет этот файл вместе с кодом (принцип 5).

## Acceptance

- [x] Полный mapping M5 issues по эпикам
- [x] Timeline по неделям с реальными датами
- [x] MVP-1/2/3 + Production-ready acceptance criteria
- [x] Critical path
- [ ] Sub-issues привязаны нативно (массовая операция, следующий PR)
- [ ] GitHub Project Roadmap view настроен Викой
- [ ] Milestones в GitHub созданы Викой по неделям
