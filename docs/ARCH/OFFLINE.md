# Offline-first стратегия

> **Статус:** Draft v0.1. Часть EPIC 6 [#57](https://github.com/Rivega42/indiahorizone/issues/57).
> Закрывает [#68](https://github.com/Rivega42/indiahorizone/issues/68).
> **Owner:** Roman.

## Контекст

Клиент в Индии — нестабильный интернет: village-роуминг, pluggable Wi-Fi отелей, перегрузки в высокий сезон. Trip Dashboard должен **полноценно работать без сети** для критичных сценариев и деградировать прозрачно для остальных.

> **Рекомендация:** «оффлайн» в travel ≠ «работает без сети любой ценой». Это значит «критичные функции работают, некритичные показывают понятный fallback». **Почему важно:** попытка сделать всё оффлайн → задвоение логики, конфликты при синхронизации, баги. Критичные сценарии (документы, программа, SOS) — обязательно. Маркетплейс активностей и чат с менеджером — нет.

## Классификация фич по offline-режиму

| Фича | Offline-mode | Sync-стратегия |
|---|---|---|
| Паспорт + виза + ваучер + страховка | **MUST** offline | Pre-fetch при онбординге |
| Программа дня (статичная) | **MUST** offline | Pre-fetch + pull at открытии |
| Карта региона | **MUST** offline | Pre-download Mapbox region за 7 дней до старта |
| Кружок (запись) | **MUST** offline | Local queue + retry (см. [`VIDEO_CIRCLE/QUEUE.md`](./VIDEO_CIRCLE/QUEUE.md)) |
| Текстовый фидбэк | **MUST** offline | Local queue + retry |
| SOS триггер | **MUST** offline | SMS-fallback при отсутствии IP (см. [`docs/SOS/FALLBACK.md`](../SOS/FALLBACK.md)) |
| Чат с concierge (история) | **SHOULD** offline | Cache последних N сообщений |
| Чат с concierge (отправка) | **SHOULD** offline | Local queue + retry |
| Контакты гида / экстренные | **MUST** offline | Pre-fetch |
| Поиск активностей / каталог | NO offline | Сетевой fallback с понятным сообщением |
| Учёт расходов гида | **MUST** offline (для гида) | Local queue |
| Push-уведомления | OS-уровень | Через FCM/APNs (работает даже при отсутствии в приложении) |

## Архитектура

### Web (PWA)

```
┌────────────────────────────────────────────┐
│              Browser                        │
├────────────────────────────────────────────┤
│  Next.js App (App Router)                  │
│       ↕ React Query (server-state)         │
│  ─────────────────────────────────────────  │
│  Service Worker (Workbox)                  │
│       │                                    │
│       ├─ Cache: static assets, app shell   │
│       ├─ Cache: api responses (stale-      │
│       │         while-revalidate)          │
│       └─ Background Sync: queue requests   │
│  ─────────────────────────────────────────  │
│  IndexedDB (через Dexie)                   │
│       ├─ trips_cache                       │
│       ├─ documents_cache                   │
│       ├─ feedback_queue                    │
│       └─ chat_messages_queue               │
└────────────────────────────────────────────┘
```

### Mobile (React Native)

```
┌────────────────────────────────────────────┐
│              React Native                  │
├────────────────────────────────────────────┤
│  React Query                                │
│       ↕                                     │
│  AsyncStorage (small KV) + WatermelonDB    │
│  (или SQLite через op-sqlite)               │
│       ├─ trips, day_plans, documents       │
│       ├─ feedback queue                    │
│       ├─ chat queue                        │
│       └─ media queue (см. VIDEO_CIRCLE)    │
│       ↕                                     │
│  Background tasks                          │
│   iOS: BGTaskScheduler                     │
│   Android: WorkManager                     │
└────────────────────────────────────────────┘
```

## Pre-fetch стратегия

### Что и когда

| Когда | Что заранее загружаем |
|---|---|
| После оплаты поездки | Персональные документы PDF, программа, контакты гида |
| За 7 дней до старта | Карта Mapbox региона, фото/видео материалы маршрута, иконки активностей |
| За 3 дня до старта | Финальная версия программы (если изменилась), telegram-username concierge |
| При первом открытии в Wi-Fi | Полный кеш всех PDF + GeoJSON маршрута |

### Bandwidth-лимит

> **Рекомендация:** клиент в РФ может иметь дорогой мобильный интернет → не качать карты вне Wi-Fi. **Почему важно:** «карта Раджастана» — 100–200 МБ. На мобильной — это деньги. По умолчанию Mapbox region downloads только в Wi-Fi.

UI-проверка: при первом открытии — экран «вы готовы к поездке: 0/4. Подключитесь к Wi-Fi для скачивания (~ 250 МБ)».

## Sync-стратегия

### Pull (server → client)

- **React Query** + `staleTime: 5 минут` для статичных данных
- При offline → возврат из cache + индикатор «офлайн, кеш от <время>»
- При reconnect → автоматический refetch активных queries

### Push (client → server)

Используется **outbox pattern** на клиенте:

```
1. Пользователь выполняет действие (отправка фидбэка, кружка)
2. Запись добавляется в локальный outbox (IndexedDB / SQLite)
3. UI сразу подтверждает действие («отправлено»)
4. Background sync пытается отправить
5. При успехе — удаляет из outbox + публикует событие в локальный
   event-bus, чтобы UI обновился
6. При неуспехе — экспоненциальный backoff
```

### Outbox-формат

```typescript
interface OutboxEntry {
  id: string;             // UUID v4 на устройстве
  endpoint: string;       // 'POST /feedback' и т.п.
  payload: object;
  idempotencyKey: string; // для дедупликации на сервере
  createdAt: number;
  attempts: number;
  nextRetryAt: number;
  status: 'pending' | 'in_flight' | 'failed' | 'expired';
  expiresAt?: number;     // для feedback — конец поездки + 7 дней
}
```

### Idempotency

**Каждый запрос на запись** — с заголовком `Idempotency-Key: <uuid>`.

Сервер хранит таблицу `idempotency_keys` (TTL 7 дней): при повторе того же ключа возвращает кешированный ответ. См. [`EVENTS.md` § Идемпотентность](./EVENTS.md).

> **Рекомендация:** idempotency-key — на каждом write-эндпоинте, даже «безопасных» с виду. **Почему важно:** в нестабильной сети двойная отправка — норма. Без idempotency мы получим двойные платежи / двойные кружки / двойные сообщения. Поведение «дубль» катастрофично для финансов.

## Конфликты при sync

В travel-фазе 3 конфликты редки — клиент в основном записывает (фидбэк, кружок), а sales/concierge редактирует со своей стороны. Но они возможны:

| Конфликт | Стратегия |
|---|---|
| Клиент изменил профиль офлайн, sales одновременно — на сервере | **Last-write-wins** с уведомлением «ваш менеджер обновил данные» |
| Клиент отправил фидбэк дважды (сеть зависла) | **Idempotency** на сервере → второй запрос возвращает первый ответ |
| Концьерж изменил программу, клиент кешировал старую | **Server-wins**, при reconnect — push «программа обновлена» |
| Гид загрузил фото, attached к не тому клиенту | **Audit + manual fix**, не автоматизируем |

> **Рекомендация:** не пытаемся реализовать CRDT в фазе 3. **Почему важно:** CRDT — отдельный мир сложности, который нам не нужен. last-write-wins + idempotency + понятный UX «обновили — посмотри новое» закрывает 95% случаев. Когда станут нужны realtime-collab фичи — пересмотрим.

## Service Worker — стратегии кеширования

| Ресурс | Стратегия |
|---|---|
| App shell (HTML, JS, CSS) | `CacheFirst` с версионированием (через build-hash) |
| API GET-запросы | `StaleWhileRevalidate` |
| Images (avatar, hotel pics) | `CacheFirst` с TTL 7 дней |
| Документы (PDF) | `CacheFirst` навечно (явно invalidated при обновлении) |
| API POST/PATCH/DELETE | `NetworkOnly` + Background Sync queue |

## UX правила для оффлайн

### Индикатор состояния

В шапке всегда виден один из трёх статусов:

```
🟢 Онлайн
🟡 Офлайн, использую кеш от <время>
🔴 Нет сети, действия ставятся в очередь (3 в очереди)
```

### Понятные fallbacks

- На некэшируемом экране (например, поиск) — «нет сети, попробуйте позже» + retry-кнопка
- На write-формах — никогда не теряем введённые данные, всегда добавляем в outbox
- При success outbox-доставки — toast «отправлено» (даже если уже видно как «отправлено» в UI)

### Без мерцающего UI

При reconnect не показываем «загрузка» поверх кеша, если данные изменились незначительно. Меняем тихо или показываем eyebrow «обновлено».

## Безопасность offline

| Угроза | Защита |
|---|---|
| Кража устройства → доступ к ПДн | App-PIN (биометрия) при открытии. Кеш зашифрован. |
| Расшифровка SQLite/IndexedDB | На iOS — Data Protection (Complete), на Android — encrypted SharedPreferences + SQLCipher. На web — IndexedDB зашифрован session-key (получаем при login, не персистится). |
| Старый кеш ПДн после удаления | При logout / отзыве согласия — wipe всех локальных данных |
| MITM с поддельным сервером | Certificate pinning в mobile-приложении |

> **Рекомендация:** PIN-код для приложения **обязателен** при чувствительных данных в кеше. **Почему важно:** клиент в travel часто оставляет телефон без присмотра (стол в кафе, отель без safe-box). Без PIN при потере телефона — паспорт и виза в открытом виде на чужих руках.

## Тестирование

### Чек-лист для каждой offline-фичи

- [ ] Работает в `airplane mode` после первого открытия в сети
- [ ] При reconnect не теряет введённые данные
- [ ] Idempotency проверена (двойная отправка → один результат)
- [ ] При ⏰ старого кеша показывает индикатор
- [ ] Wipe данных при logout проверен
- [ ] Нет утечки данных в production logs

### Симулятор условий

- Chrome DevTools → Network → Slow 3G / Offline
- Charles Proxy для управляемых задержек
- Реальный тест: телефон в `airplane mode` после онбординга

## Метрики

В Prometheus:
- `offline.cache.hit.rate` — % запросов, обслуженных из кеша
- `offline.outbox.size_p95` — размер outbox по перцентилям
- `offline.outbox.delivery.duration` — от создания до ack
- `offline.outbox.expired.count` — сколько entry умерло, не доставив

## Acceptance criteria (#68)

- [x] Классификация фич по offline-режиму
- [x] Архитектура для web + mobile
- [x] Pre-fetch стратегия с bandwidth-лимитом
- [x] Outbox pattern + idempotency
- [x] Service Worker стратегии
- [x] UX правила
- [x] Безопасность кеша
- [ ] Реализовано в коде (M5 backlog)
- [ ] Метрики настроены
