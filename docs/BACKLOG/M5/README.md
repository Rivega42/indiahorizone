# M5 — атомарный backlog

> **Статус:** Draft v0.1, **не утверждён founders**.
> **Цель:** атомизировать M5 (modular monolith + кружок production + SOS + базовый MVP slice) в готовые к копированию в GitHub Issues задачи.
>
> Для общего обзора M5 см. [`docs/ARCH/`](../../ARCH/). Для процесса создания issues — [`docs/BACKLOG/README.md`](../README.md).

## Slices

| Slice | Файл | Issues | Оценка | Goal |
|---|---|---|---|---|
| A. Bootstrap | [`A_BOOTSTRAP.md`](./A_BOOTSTRAP.md) | 15 | ~51h | Скаффолд репо, Postgres+Redis+S3, NestJS+Prisma+events bus + outbox |
| B. Auth + RBAC | [`B_AUTH.md`](./B_AUTH.md) | 12 | ~56h | Register/login/2FA с recovery, refresh rotation + reuse-detection |
| C. Clients + согласия | [`C_CLIENTS.md`](./C_CLIENTS.md) | 11 | ~57h | Профиль + ПДн (column-encrypt) + 4 granular consents + DSAR |
| D. Trips + Trip Dashboard | [`D_TRIPS.md`](./D_TRIPS.md) | 13 | ~73h | Поездки, программа, Сейчас/Следующее, документы офлайн, push |
| E. Comm + чат | [`E_COMM.md`](./E_COMM.md) | 11 | ~59h | 4 канала (push/email/SMS/Telegram), realtime-чат + outbox |
| F. Media + кружок | [`F_MEDIA_CIRCLE.md`](./F_MEDIA_CIRCLE.md) | 13 | ~79h | Запись/сжатие/очередь/upload/transcode/playback кружка |
| G. Feedback + NPS | [`G_FEEDBACK.md`](./G_FEEDBACK.md) | 6 | ~26h | Ежедневный фидбэк (текст/кружок), negative-detection, NPS |
| H. SOS production | [`H_SOS.md`](./H_SOS.md) | 10 | ~52h | Hold-to-trigger, SLA-таймер, эскалация, SMS-fallback, post-incident |
| I. Finance baseline | [`I_FINANCE.md`](./I_FINANCE.md) | 9 | ~41h | Invoice → ссылка → manual-confirm в фазе 3, AML, refund manual, inter-co |
| J. Catalog + панель гида | [`J_CATALOG.md`](./J_CATALOG.md) | 7 | ~36h | Каталог гидов/отелей, panel: смена + фото + расходы |
| K. Cross-cutting | [`K_CROSSCUT.md`](./K_CROSSCUT.md) | 11 | ~56h | Audit wildcard, Vault, rate-limit, traces, dashboards, deploy, backup, security |

**Итого:** ~118 issues, ≈ 586 часов.

## Реалистичная оценка по командам

| Команда | Hours | Calendar |
|---|---|---|
| 1 fullstack solo | ~600h | ~5 месяцев |
| 2 dev (1 BE + 1 FE) | ~600h / 1.6× = ~375h | ~3 месяца |
| 3 dev (BE + FE + mobile) + part-time devops | ~600h / 2.5× = ~240h | ~2 месяца |

> **Рекомендация:** оценки — гипотеза, не контракт. После закрытия 2–3 issues в реальности — скоррекитровать. Травел-tech почти всегда «×1.5» от первой оценки из-за edge-cases в сетевых сценариях. **Почему важно:** недооценка — главная причина срыва дедлайна и решения «сделать как-нибудь, а потом перепишем», которые становятся постоянными.

## Граф зависимостей (high-level)

```
     A (bootstrap)
        ↓
        B (auth) ───┐
        ↓           ↓
     C (clients)   E (comm)
        ↓           ↓
        D (trips) ──┴── G (feedback)
        ↓ ↓             ↑
        ↓ F (media/кружок)
        ↓               ↑
        H (SOS) ────────┘
        ↓
        I (finance)
        ↓
        J (catalog)
        ↓
        K (cross-cutting) — параллельно с D–J
```

Critical path: A → B → C → D → F → H. Эти slices разблокируют MVP-демо.

## Vertical-slice MVP (минимум для демо клиенту)

Если нужен **раньше** показать клиенту работающий продукт:

**MVP-1 (≈ 3 недели solo, 2 недели команды):**
- Slice A полностью
- Slice B минимум (B-001..B-006, без 2FA)
- Slice C минимум (C-001, C-003)
- Slice D минимум (D-001, D-002, D-004, D-006) — клиент видит главный экран

**MVP-2 (+2–3 недели):** добавляем F (кружок) + H (SOS).

**MVP-3 (+2 недели):** I (finance) + J (catalog).

> **Рекомендация:** MVP-1 — приоритет. **Почему:** имея working демо после 3 недель, founders смогут показать клиентам и уточнить product fit. Без working демо — 5 месяцев разработки в вакууме, риск построить «не то».

## Метки (labels) для GitHub

Каждое issue имеет 4 категории:

- `area:*` — auth, clients, trips, sos, comm, media, finance, catalog, audit, repo, ci, infra, web, observability, security, deploy
- `slice:*` — A..K
- `priority:*` — p0, p1, p2
- `type:*` — feat, fix, chore, docs, test

Дополнительно:
- `epic:M5` — для всех M5-issues
- `good-first-issue` — выбранные простые (например, A-002, A-003)

## План массовой выгрузки в GitHub

1. **Founders ревьюят backlog** в репо — 1–3 итерации правок
2. **Утверждение приоритетов и оценок** — что P0 / P1 / P2
3. **Утверждение нумерации** — `IH-M5-A-001` останется как есть, или переходим на сквозную GitHub-нумерацию (#101, #102, ...)
4. **Скрипт массового создания** через `mcp__github__create_or_update_issue` или `gh issue create` — ассистент готов реализовать после команды founders
5. **Связь с эпиком** — все issues линкуются к существующему [#57 EPIC 6](https://github.com/Rivega42/indiahorizone/issues/57)

## Что делать дальше (рекомендация)

1. **Ревью этого README** — убедиться, что slice-резка совпадает с видением founders
2. **Ревью slice A и B** — это блокирует всё остальное, важно зафиксировать первыми
3. **Если ок — начинаем выгрузку в GitHub** и параллельно стартуем разработку slice A

## Acceptance criteria

- [x] 11 slice-файлов с атомарными issues
- [x] Каждое issue в формате готовом к копированию (Title, Type, Estimate, Owner, Deps, Acceptance, Files, Labels)
- [x] Граф зависимостей
- [x] Реалистичные оценки в часах
- [x] План MVP подмножеств
- [ ] Утверждение founders (TODO)
- [ ] Массовая выгрузка в GitHub Issues (после утверждения)
