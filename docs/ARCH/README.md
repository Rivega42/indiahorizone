# Архитектура IndiaHorizone — индекс

> **Статус:** Draft v0.1. Часть EPIC 6 [#57](https://github.com/Rivega42/indiahorizone/issues/57).
> **Owner:** Roman.
> **Контекст:** фаза 3 — клиенты есть, кода почти нет. Задача — спроектировать систему так, чтобы сейчас её мог поддерживать 1 человек, а через год — расширять без переписывания.

## Принципы

1. **Modular monolith first, microservices later.** Один deployable, чёткие модульные границы и контракты. Service map совпадает с финальным микросервисным разрезом, чтобы extraction был механическим. См. [`MICROSERVICES.md`](./MICROSERVICES.md).
2. **Mobile/offline-first для клиента.** Клиент в Индии без интернета должен иметь рабочий продукт. См. [`OFFLINE.md`](./OFFLINE.md).
3. **Event-driven core.** Кросс-модульное взаимодействие — через domain events, не через прямые вызовы. См. [`EVENTS.md`](./EVENTS.md).
4. **Безопасность по умолчанию.** ПДн зашифрованы, аудит включён везде, секреты — никогда в коде. См. [`SECURITY/`](./SECURITY/).
5. **Кружок — first-class citizen.** Это ключевая UX-механика, под неё отдельная инфраструктура. См. [`VIDEO_CIRCLE/`](./VIDEO_CIRCLE/).

> **Рекомендация:** в фазе 3 НЕ разворачиваем «настоящие» микросервисы (k8s, service mesh, отдельные БД). **Почему важно:** operational cost микросервисов задушит команду из 2 founders при 50–100 клиентах. Modular monolith с правильно расставленными границами даёт 90% преимуществ микросервисов (модульность, тестируемость, понятные ownership-зоны) без 90% операционной стоимости. Extraction в сервисы — когда метрика «один деплой блокирует 3+ команды» начнёт болеть.

## Документы

| Документ | Что внутри |
|---|---|
| [`MICROSERVICES.md`](./MICROSERVICES.md) | Карта сервисов, их обязанности, контракты, владение данными |
| [`OFFLINE.md`](./OFFLINE.md) | Стратегия offline-first, кеширование, синхронизация, конфликты |
| [`EVENTS.md`](./EVENTS.md) | Domain events, шина, протокол, идемпотентность |
| [`VIDEO_CIRCLE/`](./VIDEO_CIRCLE/) | Кружок: запись, сжатие, очередь, доставка, воспроизведение |
| [`SECURITY/`](./SECURITY/) | 2FA, audit log, secrets management |
| `OBSERVABILITY/` (TBD) | Metrics, traces, logs, alerting |

## Стек (целевой, согласован с CLAUDE.md)

| Слой | Технология | Замечание |
|---|---|---|
| Frontend / клиент | Next.js 14 App Router + React 18 + TS, PWA | offline-first через Service Worker |
| Mobile | React Native / Expo | shared bridge с web через React |
| UI | Tailwind + shadcn/ui | |
| Backend | NestJS + Prisma | Modular monolith с module-boundaries |
| БД | PostgreSQL 15 | Один кластер, схемы по модулям |
| Кеш / очередь | Redis 7 (Streams + Pub/Sub) | Event bus в фазе 3 |
| Файлы | S3-совместимое (Yandex/Cloudflare R2) | Шифрование at rest |
| Realtime | WebSocket / SSE | Concierge inbox, SOS |
| AI | OpenAI API (GPT-4o) | Маршруты-помощник |
| Notifications | FCM, APNs, Telegram Bot, SMS | См. comm-svc |
| Видео | FFmpeg (lambda) | Транскод H.264/AAC |
| Карты | Mapbox (offline regions) | |
| Инфра | Docker Compose → fly.io / Hetzner | k8s — фаза 4 |
| CI/CD | GitHub Actions | |
| Observability | Prometheus + Grafana + Loki | |

## Связь с другими документами

- [`docs/TZ/README.md`](../TZ/README.md) — каркас-индекс (точка входа)
- [`docs/USER_STORIES.md`](../USER_STORIES.md) — фичи, которые архитектура должна закрыть
- [`docs/UX/`](../UX/) — UX, который архитектура обязана поддержать
- [`docs/SOS/TECH.md`](../SOS/TECH.md) — техническая часть SOS
- [`docs/FINANCE/PAYMENTS/SCHEME.md`](../FINANCE/PAYMENTS/SCHEME.md) — платежи и финансовая архитектура
- [`docs/BACKLOG/M5_BACKLOG.md`](../BACKLOG/M5_BACKLOG.md) — атомарный backlog M5

## Acceptance criteria

- [x] Индекс архитектуры существует
- [x] Принципы зафиксированы
- [x] Карта документов
- [x] Стек согласован с CLAUDE.md
- [ ] OBSERVABILITY раздел (отдельный milestone)
