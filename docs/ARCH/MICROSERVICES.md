# Карта сервисов IndiaHorizone

> **Статус:** Draft v0.1. Часть EPIC 6 [#57](https://github.com/Rivega42/indiahorizone/issues/57).
> **Owner:** Roman.

## Подход

**Modular monolith** в фазе 3 → **microservices** в фазе 4–5 при росте.

Один deployable (NestJS-приложение), но:
- каждый модуль = отдельная папка `apps/api/src/modules/<svc-name>`
- собственная Prisma-схема (`schema/<svc>.prisma` или namespace в одной schema.prisma)
- собственный публичный API (контроллеры) + внутренний модульный API (services)
- собственные события в шину (см. [`EVENTS.md`](./EVENTS.md))
- кросс-модульные обращения **только через**: (а) события, (б) явные internal SDK-интерфейсы

> **Рекомендация:** жёсткое правило — модуль НЕ импортирует напрямую сервисы другого модуля. Только через `<svc>.client.ts` адаптер. **Почему важно:** это единственный механизм, который физически делает extraction в микросервисы тривиальным. Без этого мы получим спагетти-импорты, и переход в реальные сервисы займёт квартал переписываний.

## Карта сервисов

```
┌────────────────────────────────────────────────────────────────┐
│                     FRONTEND (web/mobile)                       │
│   trip-dashboard | concierge-panel | guide-panel | sales-CRM   │
└──────────────────────┬─────────────────────────────────────────┘
                       │ REST + WS
┌──────────────────────┴─────────────────────────────────────────┐
│                         API GATEWAY                             │
│              (NestJS app, реверс-роутинг, auth)                 │
└─┬──┬──┬──┬──┬──┬──┬──┬──┬──┬─────────────────────────────────┘
  │  │  │  │  │  │  │  │  │  │
┌─┴──┴──┴──┴──┴──┴──┴──┴──┴──┴┐
│           CORE MODULES        │
├──┬──┬──┬──┬──┬──┬──┬──┬──┬──┤
│auth│clients│trips│sos│comm│media│finance│catalog│audit│notif│
└──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘
                       │
              ┌────────┴────────┐
              │   EVENT BUS     │
              │  (Redis Streams) │
              └────────┬────────┘
                       │
              ┌────────┴────────┐
              │  Subscribers / │
              │   Workers       │
              └────────────────┘
```

## Сервисы — обязанности и владение данными

### 1. `auth-svc`

**Обязанность:** аутентификация, сессии, 2FA, RBAC.

**Владеет:** `users`, `sessions`, `auth_codes`, `recovery_codes`, `two_fa_secrets`.

**Не владеет:** профилем клиента (это `clients-svc`), данными гида (`catalog-svc`).

**API (публичные эндпоинты):**

```
POST   /auth/register            (email + password)
POST   /auth/login                (→ access token + refresh)
POST   /auth/refresh
POST   /auth/logout
POST   /auth/2fa/enroll
POST   /auth/2fa/verify
GET    /auth/me                   (текущий пользователь)
POST   /auth/password/reset
```

**События публикует:**
- `auth.user.registered`
- `auth.user.logged_in`
- `auth.2fa.enabled`
- `auth.password.changed`

**События слушает:** —

**Зависимости:** `audit-svc` (для лога), `comm-svc` (для отправки кодов).

См. [`SECURITY/2FA.md`](./SECURITY/2FA.md).

---

### 2. `clients-svc`

**Обязанность:** профиль клиента, ПДн, согласия, история.

**Владеет:** `clients`, `client_profiles`, `consents`, `emergency_contacts`, `client_passports` (encrypted).

**API:**

```
GET    /clients/me
PATCH  /clients/me
GET    /clients/:id                (admin/concierge/sales)
POST   /clients/me/consents/:type
DELETE /clients/me/consents/:type  (отзыв согласия)
POST   /clients/me/emergency-contacts
GET    /clients/me/passport        (только с 2FA)
PATCH  /clients/me/preferences
```

**События публикует:**
- `clients.consent.granted`
- `clients.consent.revoked`
- `clients.passport.uploaded`
- `clients.profile.updated`

**События слушает:**
- `auth.user.registered` → создаёт пустой профиль

**Зависимости:** `auth-svc`, `audit-svc`.

**Шифрование:** паспорт + emergency contacts → AES-256-GCM, ключ в Vault.

> **Рекомендация:** ВСЕ ПДн-поля шифруются на уровне колонок (column-level encryption), не «весь рядок». **Почему важно:** debug/support иногда требует прочитать имя клиента, но НЕ паспорт. Если шифровать всё — придётся расшифровывать целиком, и audit-log становится слепым к чувствительным операциям.

---

### 3. `trips-svc`

**Обязанность:** поездки, маршруты, бронирования, статусы.

**Владеет:** `trips`, `itineraries`, `bookings`, `documents`, `day_plans`.

**API:**

```
GET    /trips                       (список своих)
GET    /trips/:id
POST   /trips                       (sales/manager)
PATCH  /trips/:id
GET    /trips/:id/itinerary
PATCH  /trips/:id/itinerary
GET    /trips/:id/documents
POST   /trips/:id/documents         (загрузка)
GET    /trips/:id/today              (сейчас + следующее)
POST   /trips/:id/status             (в пути, завершена и т.д.)
```

**События публикует:**
- `trips.created`
- `trips.status.changed`
- `trips.day.started`
- `trips.day.ended`
- `trips.completed`

**События слушает:**
- `finance.payment.received` → меняет статус на `paid`
- `clients.consent.revoked` → может отменить поездку
- `media.upload.completed` → привязывает документ

**Зависимости:** `clients-svc`, `auth-svc`, `media-svc` (для документов).

---

### 4. `sos-svc`

**Обязанность:** SOS-канал, гарантированная доставка, ack, эскалация.

**Владеет:** `sos_events`, `sos_acks`, `sos_escalations`.

**API:**

```
POST   /sos                          (триггер от клиента)
POST   /sos/:id/ack                  (concierge)
POST   /sos/:id/escalate
GET    /sos/active                   (активные у дежурного)
GET    /sos/:id                       (детали)
POST   /sos/:id/resolve
POST   /sos/:id/post-incident         (отчёт)
```

**События публикует:**
- `sos.triggered`
- `sos.acked`
- `sos.escalated`
- `sos.resolved`

**События слушает:** — (всё push-driven).

**Зависимости:** `comm-svc` (push, SMS, звонок), `audit-svc`, `clients-svc` (для emergency contacts).

> **Рекомендация:** sos-svc должен иметь собственный отдельный путь push/SMS, не разделяя очередь с маркетинговыми сообщениями. **Почему важно:** в час пик маркетинговая рассылка может задушить SOS на сотни мс — недопустимо. Топ-приоритет очереди + dedicated workers.

См. [`docs/SOS/TECH.md`](../SOS/TECH.md).

---

### 5. `comm-svc`

**Обязанность:** все исходящие коммуникации — push, email, SMS, Telegram, in-app chat.

**Владеет:** `notifications`, `notification_templates`, `chat_threads`, `chat_messages`.

**API:**

```
POST   /comm/notify                   (внутренний — другие модули)
POST   /comm/chat/:thread/messages
GET    /comm/chat/:thread/messages
POST   /comm/chat                     (создать тред)
WS     /comm/chat                      (realtime)
```

**События публикует:**
- `comm.message.sent`
- `comm.message.delivered`
- `comm.notification.failed`

**События слушает:**
- `auth.user.registered` → welcome email
- `trips.created` → push клиенту
- `sos.triggered` → priority push concierge
- `feedback.requested` → push клиенту
- ...

**Зависимости:** провайдеры (FCM, APNs, Telegram Bot API, SMS-провайдер, SMTP).

**Принцип:** comm-svc — единственная точка отправки наружу. Никакой другой модуль не имеет прямого SDK к FCM/APNs/Telegram. Это обеспечивает централизованное логирование и контроль over-messaging.

---

### 6. `media-svc`

**Обязанность:** загрузка, хранение, транскод, выдача фото/видео (включая кружок).

**Владеет:** `media_assets`, `media_uploads`, `media_transcodes`.

**API:**

```
POST   /media/upload-url             (presigned URL для S3)
POST   /media/:id/finalize            (после upload)
GET    /media/:id                      (метаданные + signed URL)
DELETE /media/:id
POST   /media/circles                  (специфичный endpoint для кружков)
```

**События публикует:**
- `media.upload.started`
- `media.upload.completed`
- `media.transcode.completed`
- `media.transcode.failed`

**События слушает:**
- `trips.completed` → пометить связанные media как `archive_eligible`
- `clients.consent.revoked` → удалить публичные ссылки

**Зависимости:** S3, FFmpeg lambda.

См. [`VIDEO_CIRCLE/`](./VIDEO_CIRCLE/) — детали кружка.

---

### 7. `finance-svc`

**Обязанность:** платежи, инвойсы, возвраты, AML, inter-co учёт.

**Владеет:** `payments`, `invoices`, `refunds`, `aml_checks`, `interco_transfers`.

**API:**

```
POST   /finance/invoices                  (sales/manager)
POST   /finance/invoices/:id/pay
POST   /finance/refunds
GET    /finance/clients/:id/payments
POST   /finance/aml/check                  (внутр.)
POST   /finance/interco/transfer           (между РФ ↔ IN)
```

**События публикует:**
- `finance.payment.received`
- `finance.payment.failed`
- `finance.refund.processed`
- `finance.aml.flagged`

**События слушает:**
- `trips.created` → создаёт инвойс
- `trips.cancelled` → запускает возврат

**Зависимости:** платёжный шлюз (TBD), банк-клиент, `audit-svc`, `comm-svc`.

См. [`docs/FINANCE/PAYMENTS/SCHEME.md`](../FINANCE/PAYMENTS/SCHEME.md), [`AML.md`](../FINANCE/PAYMENTS/AML.md).

> **Рекомендация:** в фазе 3 НЕ интегрируем платёжный шлюз сразу с автоматическим списанием. **Почему важно:** при чеке 200–500 тыс ₽ один failed-платёж = большая боль клиента. Делаем «invoice + ссылка на оплату», pay/fail отслеживаем, ручную верификацию допускаем. Полная автоматизация — после 200+ платежей в год.

---

### 8. `catalog-svc`

**Обязанность:** справочники — отели, гиды, активности, маршруты-шаблоны.

**Владеет:** `hotels`, `guides`, `activities`, `route_templates`, `partners`.

**API:**

```
GET    /catalog/hotels?region=...
GET    /catalog/guides?region=...&active=true
GET    /catalog/activities?theme=...
GET    /catalog/templates
POST   /catalog/guides                    (admin)
PATCH  /catalog/guides/:id                 (рейтинг, статус)
```

**События публикует:**
- `catalog.guide.activated`
- `catalog.guide.deactivated`
- `catalog.partner.flagged`

**События слушает:**
- `feedback.received` → обновляет рейтинг гида

**Зависимости:** —

---

### 9. `audit-svc`

**Обязанность:** аудит-лог всех чувствительных действий.

**Владеет:** `audit_events` (append-only).

**API:**

```
POST   /audit                              (внутр.)
GET    /audit?actor=...&object=...         (admin only)
```

**События публикует:** —

**События слушает:** **все** события (broadcast subscriber) → пишет в audit-log.

**Зависимости:** —

См. [`SECURITY/AUDIT_LOG.md`](./SECURITY/AUDIT_LOG.md).

---

### 10. `feedback-svc`

**Обязанность:** ежедневный фидбэк, кружки (метаданные), NPS.

**Владеет:** `feedbacks`, `feedback_requests`, `nps_scores`.

**API:**

```
POST   /feedback                          (клиент отправляет)
GET    /trips/:id/feedbacks
GET    /clients/:id/nps
POST   /feedback/circles                   (binding к media-svc)
```

**События публикует:**
- `feedback.received`
- `feedback.negative.detected` → triggers concierge alert

**События слушает:**
- `trips.day.ended` → создаёт `feedback_request` + push через comm-svc
- `media.upload.completed` (для кружка) → связывает с feedback

**Зависимости:** `media-svc`, `comm-svc`, `trips-svc`.

> **Рекомендация:** feedback-svc и media-svc — отдельные модули, но кружок-события идут через **обе пары рук**. **Почему:** media-svc отвечает за сам файл, feedback-svc — за привязку к дню/клиенту. Если их слить, теряется возможность переиспользовать media-svc для не-кружков (фото гида, документы).

## Cross-cutting

| Модуль | Что |
|---|---|
| `gateway` | Реверс-роутинг, rate-limit, входной auth, корреляция запросов |
| `events-bus` | Подключение к Redis Streams, publish/subscribe утилиты |
| `secrets` | Подключение к Vault / KMS, кеш ключей, ротация |
| `observability` | Prometheus exporter, OpenTelemetry traces |

## Контракты — версионирование

- Внутренние SDK-клиенты модулей (`<svc>.client.ts`): semver, breaking → major.
- Публичные REST API: `/api/v1/...`. Перед deprecation — 6 мес. поддержки v(N) и v(N+1) параллельно.
- События: `<service>.<entity>.<verb>` + версионируется через payload.schema (`schema_version: 2`).

> **Рекомендация:** каждое событие имеет `schema_version`. **Почему важно:** ивенты живут долго (audit, очереди), и без version-tag миграция формата = простой системы. С тегом — потребители graceful upgrade, версии 1 и 2 могут сосуществовать.

## Владение данными — правила

1. Каждый модуль владеет своими таблицами. Никто извне не делает SQL `JOIN` через границы.
2. Чтение чужих данных — только через API/SDK-клиент.
3. Foreign keys через границы — **запрещены**. Только soft-references по ID.
4. Транзакции через границы — **запрещены**. Используется Saga / event-driven compensation.

> **Рекомендация:** правило «нет cross-module FK» режет глаз DBA. **Почему важно:** именно это правило позволяет физически разделить базы при extraction в микросервисы. Если есть FK trips → users — миграция в отдельную БД невозможна без переписывания.

## Deployment topology

### Фаза 3

```
┌─────────────────────────────────────────┐
│   fly.io / Hetzner (single region: EU)  │
├─────────────────────────────────────────┤
│  api (NestJS monolith) × 2 instances    │
│  postgres × 1 (primary + read-replica)  │
│  redis × 1                              │
│  S3 (Yandex Cloud / Cloudflare R2)      │
└─────────────────────────────────────────┘

CDN (Cloudflare) для статики и media
```

### Фаза 4 (когда extraction)

```
gateway → independent services on k8s
critical path: sos-svc, media-svc — отдельно
```

> **Рекомендация:** в фазе 3 ЕДИНСТВЕННЫЙ регион — Европа (близко к РФ-клиентам). Для S3 — Cloudflare R2 / Yandex Object Storage. **Почему важно:** российский клиент со смартфоном в Гоа подтянет картинки с EU-CDN за ~150 мс, что приемлемо. Ставить инфра в Индии в фазе 3 — переусложнение, мы оптимизируем under-the-hood для русского клиента, не для индийского.

## Связь с user stories и UX

| User Story | Какие модули задействованы |
|---|---|
| US-CL-1 (КП за 2 дня) | trips-svc, finance-svc, comm-svc |
| US-CL-2 (онлайн-оплата) | finance-svc, auth-svc |
| US-CL-3 (анкета один раз) | clients-svc |
| US-CL-4 (документы офлайн) | trips-svc, media-svc, OFFLINE.md |
| US-CL-5 (Сейчас/Следующее) | trips-svc, OFFLINE.md |
| US-CL-6 (кружок из push) | comm-svc, media-svc, feedback-svc |
| US-CL-7 (SOS hold-to-trigger) | sos-svc, comm-svc |
| US-CL-9 (повторная сделка) | clients-svc, trips-svc |
| US-CL-10 (реферал) | clients-svc, finance-svc |
| US-GD-1 (смена и клиенты гид) | catalog-svc, trips-svc |
| US-CC-1 (concierge inbox) | comm-svc, sos-svc |

## Acceptance criteria

- [x] 10 модулей с обязанностями, владением, API, событиями
- [x] Cross-cutting (gateway, events-bus, secrets, observability)
- [x] Правила владения данными (no cross-FK, no SQL across boundaries)
- [x] Версионирование контрактов
- [x] Deployment topology фазы 3 и 4
- [x] Связь с user stories
- [ ] OpenAPI spec для каждого сервиса (отдельный milestone)
- [ ] ER-диаграммы по модулям (отдельный milestone)
