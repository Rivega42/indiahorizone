# 🗺️ Roadmap — IndiaHorizone

## Обзор milestone'ов

```
M1 MVP Core ──────────────────────────────────► ✅
M2 Client Dashboard ──────────────────────────► ✅  
M3 CRM ───────────────────────────────────────► ✅
M4 Guide App ─────────────────────────────────► ✅
M5 Production Ready ──────────────────────────► 🟡 В работе
```

---

## M5 — Production Ready (текущий)

### M5.A — Monorepo Setup (issues #111–121)
Настройка pnpm workspaces, TypeScript, ESLint, Docker Compose, NestJS + Next.js scaffold.

| Issue | Ветка | Статус |
|-------|-------|--------|
| [#111](https://github.com/Rivega42/indiahorizone/issues/111) M5.A.1 pnpm workspaces | `feature/m5-a-1-pnpm-workspaces-111` | 🔄 |
| [#112](https://github.com/Rivega42/indiahorizone/issues/112) M5.A.2 TypeScript config | `feature/m5-a-2-typescript-config-112` | 🔄 |
| [#113](https://github.com/Rivega42/indiahorizone/issues/113) M5.A.3 ESLint + Prettier | `feature/m5-a-3-eslint-prettier-113` | 🔄 |
| [#114](https://github.com/Rivega42/indiahorizone/issues/114) M5.A.4 GitHub Actions CI | `feature/m5-a-4-github-actions-ci-114` | 🔄 |
| [#115](https://github.com/Rivega42/indiahorizone/issues/115) M5.A.5 Docker Compose | `feature/m5-a-5-docker-compose-115` | 🔄 |
| [#116](https://github.com/Rivega42/indiahorizone/issues/116) M5.A.6 NestJS scaffold | `feature/m5-a-6-nestjs-scaffold-116` | 🔄 |
| [#121](https://github.com/Rivega42/indiahorizone/issues/121) M5.A.11 Next.js scaffold | `feature/m5-a-11-nextjs-scaffold-121` | 🔄 |

### M5.B — Auth & Users (12 issues)
JWT, RBAC, регистрация/логин, роли: client, guide, manager, concierge, admin.

### M5.C — Trip Management (11 issues)
CRUD поездок, маршруты, документы, статусы, назначение гида.

### M5.D — Client Dashboard (13 issues)
Таймлайн дня, документы, контакты, SOS, оффлайн-режим.

### M5.E — Daily Feedback (11 issues)
Ежедневный фидбэк: текст + видео-кружок, история, push-уведомления.

### M5.F — CRM & Sales (13 issues)
Воронка продаж, карточка клиента, квиз, коммуникации, шаблоны.

### M5.G — Notifications (6 issues)
Push (FCM/APNs), Telegram, Email, шаблоны уведомлений.

### M5.H — SOS & Emergency (10 issues)
SOS-кнопка, экстренные контакты, геометка, concierge dashboard.

### M5.I — Finance (9 issues)
Инвойсы, платежи, рефанды, AML-проверка, финансовые отчёты.

### M5.J — Guide App (7 issues)
Расписание гида, фото в альбом клиента, учёт расходов, рейтинг.

### M5.K — Security & Deploy (11 issues)
Rate-limit, Vault/KMS, audit log, staging, production, DR.

---

## Backlog (предыдущие этапы)

### EPIC 7 — UX Design
Wireframes для всех ролей: клиент, гид, CRM, Trip Dashboard.

### EPIC 8 — Программа лояльности
Рефералы, повторная скидка, VIP.

### EPIC 9 — ТЗ v1.0
Обновлённое техническое задание и документация.

### EPIC 10 — Гигиена репозитория
LICENSE, SECURITY.md, .env.example, issue templates.

---

## Соглашение по веткам

```
feature/m{N}-{epic}-{num}-{slug}-{issue}
fix/{slug}-{issue}
docs/{slug}
```

Примеры:
- `feature/m5-a-1-pnpm-workspaces-111`
- `fix/sos-button-ios-45`
- `docs/api-reference`
