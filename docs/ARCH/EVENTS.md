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

| Type | Когда | Payload | Implemented |
|---|---|---|---|
| `auth.user.registered` | После register | `{userId, email, role, source}` | ✅ #127 |
| `auth.user.logged_in` | Успешный login | `{userId, sessionId, ip, userAgent}` | ✅ #128 |
| `auth.user.logout` | Logout | `{userId, sessionId}` | ✅ #130 |
| `auth.session.refreshed` | Refresh-token rotated | `{userId, oldSessionId, newSessionId, ip}` | ✅ #129 |
| `auth.session.suspicious` | Reuse-detect или новая IP/страна | `{userId, sessionId, reasons[], ipMasked, userAgent}` | ✅ #129+#136 |
| `auth.2fa.enabled` | После verify-enroll | `{userId, recoveryCodesGenerated}` | ✅ #132 |
| `auth.2fa.disabled` | (TODO когда сделаем disable-endpoint) | `{userId}` | ⏳ |
| `auth.password.changed` | Смена пароля (через reset) | `{userId, method: 'reset-via-email'}` | ✅ #134 |

### clients-svc

| Type | Когда | Payload | Implemented |
|---|---|---|---|
| `clients.profile.created` | Auto при auth.user.registered | `{clientId, userId}` | ✅ #138 |
| `clients.profile.updated` | PATCH /clients/me | `{userId, clientId, changedFields[]}` (без значений ПДн) | ✅ #140 |
| `clients.consent.granted` | POST /consents/:type | `{userId, clientId, consentType, version, previousVersionId, newScopeKeys}` | ✅ #143 |
| `clients.consent.revoked` | DELETE /consents/:type | `{userId, clientId, consentType, consentId}` | ✅ #143 |
| `clients.passport.uploaded` | (TODO после media endpoints) | `{clientId, mediaId}` | ⏳ #141 |
| `clients.emergency_contact.added` | POST /emergency-contacts (только CREATE) | `{userId, clientId, contactId, priority}` (без name/phone) | ✅ #144 |

### trips-svc

| Type | Когда | Payload | Implemented |
|---|---|---|---|
| `trips.created` | POST /trips (manager/admin) | `{tripId, clientId, createdBy, region, startsAt, endsAt}` | ✅ #150 |
| `trips.itinerary.updated` | POST /trips/:id/itinerary/publish | `{tripId, itineraryId, version, publishedAt, previousVersion, dayPlanIds[], diff: {addedDays, removedDays, changedDays}}` | ✅ #151 |
| `trips.status.changed` | PATCH /trips/:id/status (manual) + payment-listener (paid) + cron auto-transitions (in_progress/completed) | `{tripId, from, to, reason: 'manual'\|'time-started'\|'time-ended'\|'payment-received'\|'cancellation', actorId, occurredAt}` | ✅ #160 |
| `trips.document.attached` | (TODO после media #174-178) | `{tripId, mediaId, docType}` | ⏳ |

### sos-svc

| Type | Когда | Payload |
|---|---|---|
| `sos.triggered` | Клиент нажал | `{sosId, clientId, tripId, geo, type}` |
| `sos.acked` | Concierge ack | `{sosId, conciergeId, ackTimeMs}` |
| `sos.escalated` | Эскалация | `{sosId, level, reason}` |
| `sos.resolved` | Закрыт | `{sosId, outcome}` |
| `sos.sla.breach` | Auto-detect breach | `{sosId, slaTarget, actual}` |

### comm-svc

| Type | Когда | Payload | Implemented |
|---|---|---|---|
| `comm.message.sent` | NotifyService успешно через provider (email/push/sms/tg) | `{notificationId, channel, templateId, providerMessageId, userId?}` (без `recipient` — privacy) | ✅ #162 |
| `comm.message.failed` | NotifyService permanent fail | `{notificationId, channel, templateId, errorMessage, userId?}` | ✅ #162 |
| `comm.message.delivered` | Webhook от provider'а (TODO) | `{notificationId}` | ⏳ |
| `comm.chat.message_sent` | POST /chat/threads/:id/messages | `{threadId, messageId, fromUserId, hasAttachments}` (без body — privacy) | ✅ #169 |
| `comm.push.subscribed` | POST /comm/push/subscribe | `{subscriptionId, userId, platform, reactivated}` (без endpoint/keys — privacy, endpoint per-device potentially PII) | ✅ #163 |

### media-svc

| Type | Когда | Payload | Implemented |
|---|---|---|---|
| `media.asset.uploaded` | MediaService.markUploaded (после finalize) | `{assetId, ownerId, kind, mimeType, sizeBytes, s3Key}` | ✅ #173 (event), ⏳ #174-175 (endpoints) |
| `media.upload.started` | (TODO после presigned endpoint #174) | `{mediaId, kind, size}` | ⏳ |
| `media.transcode.completed` / `media.transcode.failed` | (TODO после #176 FFmpeg worker) | `{mediaId, variants[]}` | ⏳ |
| `media.deleted` | (TODO retention #178) | `{mediaId, reason}` | ⏳ |

### feedback-svc

| Type | Когда | Payload | Implemented |
|---|---|---|---|
| `feedback.requested` | (TODO scheduled cron вечером дня поездки) | `{tripId, dayNumber, requestedAt}` | ⏳ |
| `feedback.received` | POST /feedback (client) | `{feedbackId, tripId, dayNumber, mood, type, hasMedia}` (без `body`/`mediaId` — privacy) | ✅ #188 |
| `feedback.negative.detected` | AI signals enrichment (TODO #189) | `{feedbackId, signals[]}` | ⏳ #189 |

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

### audit-svc (cross-cutting #218)

audit-svc подписан wildcard'ом `*` на ВСЕ события и пишет в append-only `audit_events`. Сам тоже публикует:

| Type | Когда | Payload | Implemented |
|---|---|---|---|
| `audit.read` | GET /audit (admin) | `{requesterId, filters: {type, actorId, actorType, from, to}, returnedCount, hasMore}` | ✅ #219 |

Recursive: `audit.read` тоже попадает в audit_events через wildcard subscriber (compliance 152-ФЗ ст. 14 — кто и когда смотрел audit-log).

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
