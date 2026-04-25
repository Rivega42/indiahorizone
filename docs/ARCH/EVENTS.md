# Domain events — шина и протокол

> **Статус:** Draft v0.1. Часть EPIC 6 [#57](https://github.com/Rivega42/indiahorizone/issues/57).
> **Owner:** Roman.

## Зачем events

Чтобы:
- Расцепить модули — `trips-svc` не знает про `comm-svc`, но push-уведомление при создании поездки уходит.
- Не блокировать критичный путь — `sos.triggered` распубликовался → дежурному пуш, аудит, escalation-таймер запущены параллельно.
- Подготовить extraction в микросервисы — события уже сегодня летят через шину, а не через прямые вызовы.
- Обеспечить аудит — `audit-svc` подписан на всё.

## Шина

### Фаза 3 — Redis Streams

```
publisher (модуль)
   ↓
Redis Stream:  events.<service>
   ↓
Consumer Group:  <subscriber-name>
   ↓
subscriber (модуль)
```

Использование Redis Streams:
- Persistence (события не теряются при рестарте)
- Consumer groups (multiple subscribers, каждый получает свой offset)
- ACK после обработки
- Replay по offset
- TTL стрима — 14 дней (для replay в инцидентах)

> **Рекомендация:** Redis Streams в фазе 3, не Kafka / NATS / RabbitMQ. **Почему важно:** мы уже держим Redis для кеша → нет +1 инфра-зависимости. Throughput фазы 3 (10s events/sec) Redis Streams выдерживает легко. NATS / Kafka — overkill при < 1k клиентов. Замена на Kafka/NATS — после 100k events/day, не раньше.

### Фаза 4 — миграция

Когда: > 100k events/day или нужны streaming-aggregations.

Куда: NATS JetStream (light) или Kafka (если нужны Connect-коннекторы).

Контракты событий не меняются — только транспорт.

## Формат события

```typescript
interface DomainEvent<T> {
  // Заголовок
  id: string;             // UUID v4
  type: string;           // <service>.<entity>.<verb> ('trips.created')
  schemaVersion: number;  // 1, 2, ...
  occurredAt: string;     // ISO 8601 UTC
  correlationId?: string; // для трейсинга через цепочку
  causationId?: string;   // ID события, которое его вызвало

  // Контекст
  actor: {
    type: 'user' | 'system' | 'gateway';
    id?: string;
    role?: string;
  };

  // Payload
  payload: T;
}
```

### Пример

```json
{
  "id": "01HW...",
  "type": "trips.created",
  "schemaVersion": 1,
  "occurredAt": "2026-04-25T10:30:00Z",
  "correlationId": "01HW-corr-...",
  "actor": {
    "type": "user",
    "id": "user_123",
    "role": "manager"
  },
  "payload": {
    "tripId": "trip_456",
    "clientId": "client_789",
    "region": "rajasthan",
    "startsAt": "2026-06-01",
    "endsAt": "2026-06-12"
  }
}
```

## Каталог событий (M5 минимум)

### auth-svc

| Type | Когда | Payload |
|---|---|---|
| `auth.user.registered` | После register | `{userId, email, source}` |
| `auth.user.logged_in` | Успешный login | `{userId, ip, userAgent}` |
| `auth.user.logout` | Logout | `{userId}` |
| `auth.2fa.enabled` | 2FA включён | `{userId, method}` |
| `auth.2fa.disabled` | 2FA выключен | `{userId}` |
| `auth.password.changed` | Смена пароля | `{userId}` |
| `auth.session.suspicious` | Аномалия (новая страна и т.п.) | `{userId, reason}` |

### clients-svc

| Type | Когда | Payload |
|---|---|---|
| `clients.profile.created` | Профиль создан | `{clientId, userId}` |
| `clients.profile.updated` | Изменены ПДн / preferences | `{clientId, fields[]}` |
| `clients.consent.granted` | Согласие дано | `{clientId, type, scope, version}` |
| `clients.consent.revoked` | Согласие отозвано | `{clientId, type}` |
| `clients.passport.uploaded` | Загружен скан | `{clientId, mediaId}` |
| `clients.emergency_contact.added` | Добавлен контакт | `{clientId, contactId}` |

### trips-svc

| Type | Когда | Payload |
|---|---|---|
| `trips.created` | Сделка → trip | `{tripId, clientId, ...}` |
| `trips.itinerary.updated` | Программа изменилась | `{tripId, dayPlanIds[]}` |
| `trips.status.changed` | Статус | `{tripId, from, to}` |
| `trips.day.started` | Начался день N | `{tripId, dayNumber, dayPlanId}` |
| `trips.day.ended` | Закончился день N | `{tripId, dayNumber}` |
| `trips.completed` | Поездка закрыта | `{tripId, durationDays}` |
| `trips.cancelled` | Поездка отменена | `{tripId, reason}` |
| `trips.document.attached` | Документ привязан | `{tripId, mediaId, docType}` |

### sos-svc

| Type | Когда | Payload |
|---|---|---|
| `sos.triggered` | Клиент нажал | `{sosId, clientId, tripId, geo, type}` |
| `sos.acked` | Concierge ack | `{sosId, conciergeId, ackTimeMs}` |
| `sos.escalated` | Эскалация | `{sosId, level, reason}` |
| `sos.resolved` | Закрыт | `{sosId, outcome}` |
| `sos.sla.breach` | Auto-detect breach | `{sosId, slaTarget, actual}` |

### comm-svc

| Type | Когда | Payload |
|---|---|---|
| `comm.message.sent` | Push/email/SMS отправлен | `{messageId, channel, to, templateId}` |
| `comm.message.delivered` | Доставлен (ack от провайдера) | `{messageId}` |
| `comm.message.failed` | Не доставлен | `{messageId, error}` |
| `comm.chat.message.posted` | Сообщение в чате | `{threadId, messageId, fromUserId}` |

### media-svc

| Type | Когда | Payload |
|---|---|---|
| `media.upload.started` | Получен presigned URL | `{mediaId, kind, size}` |
| `media.upload.completed` | Файл в S3 | `{mediaId, kind, s3Key}` |
| `media.transcode.completed` | FFmpeg готов | `{mediaId, variants[]}` |
| `media.transcode.failed` | Ошибка | `{mediaId, error}` |
| `media.deleted` | Удалено | `{mediaId, reason}` |

### feedback-svc

| Type | Когда | Payload |
|---|---|---|
| `feedback.requested` | Просим клиента | `{tripId, dayNumber, requestedAt}` |
| `feedback.received` | Клиент отправил | `{feedbackId, type, mood, tripId, dayNumber}` |
| `feedback.negative.detected` | Маркер боли | `{feedbackId, signals[]}` |

### finance-svc

| Type | Когда | Payload |
|---|---|---|
| `finance.invoice.issued` | Инвойс выписан | `{invoiceId, tripId, amount, currency}` |
| `finance.payment.received` | Оплата | `{paymentId, invoiceId, amount, method}` |
| `finance.payment.failed` | Не прошла | `{invoiceId, error}` |
| `finance.refund.processed` | Возврат сделан | `{refundId, paymentId, amount}` |
| `finance.aml.flagged` | AML-флаг | `{clientId, reason, severity}` |

### catalog-svc

| Type | Когда | Payload |
|---|---|---|
| `catalog.guide.activated` | Гид активирован | `{guideId, region}` |
| `catalog.guide.deactivated` | Деактивирован | `{guideId, reason}` |
| `catalog.guide.rating.updated` | Рейтинг изменился | `{guideId, newRating, basedOn}` |

## Правила публикации

### 1. Событие = факт

Прошедшее время глагола: `created`, `updated`, `cancelled`. Никогда `creating`, `cancel`. **Почему:** событие — это факт, не команда.

### 2. Событие — публичный API модуля

Изменение схемы события = breaking change для подписчиков. Делается через `schemaVersion: 2` + временная поддержка обоих версий 1 и 2 в течение 30 дней.

### 3. Не пушим лишнее

Не публикуем «технические» события (`db.row.inserted`). Только domain-level.

### 4. Сначала commit DB, потом publish

```typescript
await db.transaction(async (tx) => {
  await tx.trips.create({ ... });
  await outbox.add(tx, { type: 'trips.created', ... });
});
// outbox-relay воркер забирает и публикует в Redis Streams
```

> **Рекомендация:** **Transactional outbox pattern** обязателен. **Почему важно:** если опубликовали событие, а транзакция отвалилась — потребители получат ивент о несуществующем объекте. Если коммитнули БД, а publish упал — события нет, потребители не узнают. Outbox в той же транзакции + relay — единственный способ исключить оба сценария. Это базовая гигиена event-driven систем, без неё всё горит при первом крупном инциденте.

## Подписки

### Регистрация

Каждый модуль декларирует подписки в `<module>.events.ts`:

```typescript
@EventSubscriber('comm-svc')
export class CommSubscribers {
  @OnEvent('trips.created')
  async onTripCreated(event: DomainEvent<TripCreatedPayload>) {
    await this.welcomeFlow.run(event.payload);
  }

  @OnEvent('sos.triggered')
  async onSosTriggered(event: DomainEvent<SosTriggeredPayload>) {
    await this.priorityPush.send(event.payload);
  }
}
```

### Consumer groups

Один subscriber = один Redis consumer group. Это даёт:
- offset на subscriber (failed → retry без потери)
- Параллельность (один consumer group может иметь N инстансов)

### At-least-once delivery

Гарантия: подписчик получит событие **минимум один раз**, возможно больше → подписчик ОБЯЗАН быть **идемпотентным**.

### Идемпотентность

Каждый подписчик проверяет `event.id` через `processed_events` таблицу:

```typescript
async function handleEvent(event: DomainEvent) {
  const seen = await db.processedEvents.exists(event.id, this.consumerName);
  if (seen) return; // skip
  
  await this.handle(event);
  await db.processedEvents.add({ eventId: event.id, consumer: this.consumerName });
}
```

TTL `processed_events` — 30 дней. Достаточно для покрытия любых retry-циклов.

> **Рекомендация:** идемпотентность через `processed_events` — стандарт. Альтернатива «делать обработку идемпотентной по дизайну» работает только для простых случаев и сложно тестируется. Lock в БД дешевле инженерного спора. **Почему важно:** один и тот же `comm.message.sent` обработанный дважды = двойной push клиенту. Прозрачный замок в БД защищает от 90% таких ситуаций.

## Audit-subscriber

`audit-svc` подписан на **все** events (через wildcard `*`). Каждое событие пишется в append-only `audit_events`.

```typescript
@EventSubscriber('audit-svc')
@OnEvent('*')
async onAny(event: DomainEvent) {
  await this.auditLog.append(event);
}
```

См. [`SECURITY/AUDIT_LOG.md`](./SECURITY/AUDIT_LOG.md).

## Dead-letter queue

Если подписчик 5 раз подряд бросает ошибку:

1. Событие переезжает в `events.dlq.<consumer>`
2. Алерт в Grafana
3. Ручной разбор + replay через admin API

DLQ-операции:
- `GET /admin/dlq/<consumer>` — список
- `POST /admin/dlq/<consumer>/<eventId>/replay` — повторная попытка
- `POST /admin/dlq/<consumer>/<eventId>/skip` — отметить разобранным

## Мониторинг

Метрики (Prometheus):

- `events.published.total{type}` — счётчик публикаций
- `events.delivered.total{type, consumer}` — счётчик доставок
- `events.failed.total{type, consumer}` — счётчик ошибок
- `events.processing.duration{type, consumer}` — гистограмма длительности
- `events.dlq.size{consumer}` — размер DLQ
- `events.lag{consumer}` — текущее отставание от head стрима

Алерты:

| Alert | Условие |
|---|---|
| `EventLagHigh` | lag > 1000 events на любом consumer 5 минут |
| `EventFailureRateHigh` | failure rate > 5% за 10 минут |
| `DlqGrowing` | DLQ size > 10 events |
| `SosEventLag` | sos.* lag > 5 sec |

> **Рекомендация:** SOS-events идут в **отдельный Redis stream** с приоритетным consumer-group. **Почему важно:** маркетинговая рассылка не должна задерживать SOS на 30 сек. Разделение тарифов — единственная гарантия SLA для SOS.

## Acceptance criteria

- [x] Формат события (envelope + payload + schema version)
- [x] Каталог событий по модулям (M5 минимум)
- [x] Outbox pattern для публикации
- [x] At-least-once + идемпотентность подписчиков
- [x] DLQ
- [x] Audit-subscriber wildcard
- [x] Мониторинг и алерты
- [ ] Реализовано в коде (M5 backlog)
