# Бэклог IndiaHorizone

> **Источник правды:** GitHub Issues с лейблом `статус: бэклог` + GitHub Project (https://github.com/users/Rivega42/projects/3).
> **Этот файл** — фасад с приоритизированной выжимкой. Детальные acceptance criteria — в Issues / Project.
> **Детальный backlog phase 3:** [`docs/BACKLOG/M5/`](docs/BACKLOG/M5/) с разбивкой по slice'ам (A bootstrap, B auth, C clients, D trips, E comm, F media, G feedback, K cross-cut).

---

## Сейчас в спринте (Active sprint — закрытие phase 3)

### Backend (frontend-blocking)

| Issue | Что | Status | Owner |
|---|---|---|---|
| (после VAPID) | Smoke real Web Push на dev-сервере | ждёт #379 | Vika |
| #163 phase 3 | High-urgency push integration в SOS-flow когда появится | depends на #192 | Claude |

### Frontend

| Issue | Что | Status | Owner |
|---|---|---|---|
| #170 | 2FA frontend UI (enroll + verify-login challenge) | ⏳ начать | TBD |
| #137 | Playwright e2e для 2FA flow | ⏳ ждёт #170 | TBD |
| #152-#161 | Trip Dashboard frontend: программа, документы, чат, SOS | ⏳ ждёт design | TBD |
| #287 | Видео-кружки UI (запись + load circle) | ⏳ ждёт #173 media endpoints | TBD |

### Infra / DevOps (Vика)

| Issue | Что | Status |
|---|---|---|
| #379 | Установить VAPID keys в env (dev) + Vault | ⏳ открыт |
| #220 | Vault / KMS setup для production secrets | ⏳ |
| #224 | Grafana dashboards (5 boards) | ⏳ |
| #350 | Beget Object Storage credentials | ⏳ founders + Vika |
| #349 | Mailganer / Yandex / Postmark email creds | ⏳ founders + Vika |
| (новый после ШАГ 8) | `PROJECT_TOKEN` PAT rotation | будет создан |
| (новый после ШАГ 8) | Branch protection main | будет создан |
| (новый после ШАГ 9) | GitHub Pages для дашборда | будет создан |

### Strategy (P0, owners — Roman + Shivam)

| Issue | Что |
|---|---|
| #273 | Оборотный буфер -7k$ в IN PVT LTD |
| #274 | Резервный канал перевода РФ → IN |
| #278 | Нанять 2 concierge на дежурство 24/7 в Индии |
| #279 | Playbooks для 6 типов SOS-инцидентов |
| #280 | База данных госпиталей / полиции / адвокатов / такси по 9 городам |

---

## Up Next (после spring closure)

### Backend phase 4 prep

- **#192** SOS module backend — `SosEvent` + `SosAck` + `SosEscalation` модели + dispatcher (P0 strategy зависит от готовности этого + concierge найма #278)
- **#163 phase 3** Native push (FCM v1 для Android, APNs для iOS) — фаза 4 (требует Apple Developer + Firebase project)
- **#141** Passport upload — после media endpoints (#174-178)
- **#189** AI signals enrichment для feedback (sentiment, topics) — после первой LLM-интеграции

### Frontend phase 4 prep

- **EPIC 13** Marketing homepage `/` — заменить DEV-nav (прототип в `apps/web/public/prototypes/homepage.html`)
- **EPIC 14** CRM (менеджерский кабинет): leads → quote → trip → booking → invoice
- **#311 V2** Admin Panel для управления каталогом туров (без re-deploy)

### Mobile phase 4

- **`apps/mobile/`** — React Native + Expo scaffold (placeholder сейчас)
- Trip Dashboard mobile — приоритет (offline-first критично в Индии)
- Guide app mobile — фаза 4-5

---

## Discovery / Research

| Тема | Зачем |
|---|---|
| Платежные шлюзы для travel в РФ | ЮKassa vs Tinkoff vs CloudPayments — какой проще для договоров с физлицом-покупателем тура |
| AI-ассистент для чата | OpenAI vs Anthropic vs российские LLM (YandexGPT). Compliance + цена |
| Видео-кружки storage | S3 lifecycle для нерезидентских партнёров (Beget) — retention, transcode pipeline |
| Loyalty program | Как мерять (NPS / Net Promoter / referral attribution) и не превратить в bullshit |

---

## Idea Pool (не приоритизировано)

- Telegram Mini-App для guide / concierge — quick actions (acks, photo uploads)
- AI-agent для quote-generation (founder загружает запрос → черновик quote через Claude API)
- Public ленты кружков / отзывов (#283)
- White-label для других DMC (фаза 5)

---

## Заблокировано (внешние зависимости)

См. `STATE.md § Заблокировано`. Кратко: VAPID keys (Vika), Beget S3 (founders), Mailganer (founders), legal review (Roman + юрист), Apple Developer + Firebase (фаза 4 при бюджете).

---

## Технический долг

| Проблема | Impact | Priority |
|---|---|---|
| Тестовое покрытие ≈ 0 (TODO-stubs только) | Регрессии при рефакторе | P2 |
| 10 TODO/FIXME comments в коде | Низкий | P3 |
| `apps/mobile/` placeholder | Блокирует phase 4 mobile | P2 |
| Нет CodeQL scanning | Возможны уязвимости | P2 |
| Нет dependabot | Устаревшие CVE-зависимости | P1 (планируется в `chore/repo-setup` PR) |

---

## Связанные документы

- `ROADMAP.md` — high-level фазы и эпики
- `docs/BACKLOG/M5/` — backend slice-by-slice
- `docs/STRATEGY/DEVELOPMENT_PLAN.md` — стратегические блоки
- `STATE.md` — текущее состояние работ
- GitHub Project (https://github.com/users/Rivega42/projects/3) — единый source of truth для статусов
