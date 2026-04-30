# Domain — главные сущности и операции

> Доменная модель IndiaHorizone. Сущности из `apps/api/prisma/schema.prisma` с бизнес-смыслом.

## Главные актёры

- **User** — любой залогиненный (client, guide, manager, concierge, finance, admin)
- **Client** — путешественник (User с role=client, плюс `Client` запись с PII)
- **Guide** — локальный сопровождающий в Индии (User с role=guide, без отдельной таблицы пока)
- **Manager** — менеджер по продажам (Roman + future hires)
- **Concierge** — поддержка клиентов 24/7 (Шивам сейчас, плюс 2+ найма по #278)
- **Finance** — бухгалтер (внешний контрагент)
- **Admin** — Roman / Vика для системного администрирования

## Главные сущности

### Catalog domain

| Сущность | Что | Where |
|---|---|---|
| **Tour** | Шаблон тура (Керала / Гоа / Гималаи) с status, price, days, FAQ. Витрина для landing-страниц | `tours` table |
| **TourDay** | Один день тура (location, title, activities, image) | `tour_days` table |

### Client / Auth domain

| Сущность | Что |
|---|---|
| **User** | Auth-сущность (email, password hash, role, 2FA, status) |
| **Client** | Профиль путешественника (Profile с PII зашифрованы AES-GCM) |
| **ClientProfile** | Расширенные поля Client (firstName/lastName/dob/phone) — encrypted |
| **Consent** | Granular согласия (4 типа): photo_video, geo, emergency_contacts, marketing |
| **EmergencyContact** | Контакт родственника / близкого для SOS |
| **Session** | Активная JWT-сессия (для logout всех сессий, suspicious-detect) |
| **PasswordResetToken** | Tokens для сброса пароля (argon2 hash) |
| **RecoveryCode** | Recovery codes для 2FA (argon2 hash) |

### Trips domain

| Сущность | Что |
|---|---|
| **Trip** | Конкретная поездка конкретного клиента (status, dates, region, totalAmount) |
| **Itinerary** | Версионированный маршрут (DRAFT → PUBLISHED snapshot) |
| **DayPlan** | День в Itinerary (analog TourDay но для конкретной поездки) |
| **Booking** | Бронь (отель / транспорт / активность) внутри Trip |

**Trip.status state-machine** (#160):
```
draft → paid → in_progress → completed
              ↓
         cancelled (любая phase до completed)
```

### Comm domain

| Сущность | Что |
|---|---|
| **ChatThread** | Тред чата (thread = conversation между client + concierge / manager / guide) |
| **ChatMessage** | Сообщение в треде |
| **Notification** | Запись об отправке (channel: email/push/sms/telegram, status: pending/sent/failed) |
| **NotificationPreference** | User'ская настройка категории × канала (4×4 матрица) |
| **PushSubscription** | W3C Web Push subscription (endpoint + p256dh + auth keys) |

### Media domain

| Сущность | Что |
|---|---|
| **MediaAsset** | Медиа-файл (photo / video / circle / document) с status (pending/uploaded/transcoded/failed) и s3_key |

### Feedback domain

| Сущность | Что |
|---|---|
| **FeedbackRequest** | Запрос фидбэка от системы клиенту (cron вечером дня поездки) |
| **Feedback** | Ответ клиента (text + mood + опционально circle media) |

### Cross-cut

| Сущность | Что |
|---|---|
| **OutboxEntry** | Транзакционный outbox для events (#119) |
| **ProcessedEvent** | Idempotency для consumers (#120) |
| **AuditEvent** | Append-only журнал domain events (Postgres trigger blocks UPDATE/DELETE) |

## Ключевые операции (use cases)

### Sales flow

1. Visitor → `/tours` index → `/tours/<slug>` landing
2. Заполняет LeadForm с consent → `POST /leads` → Lead в БД + Telegram-нотификация менеджеру
3. Менеджер связывается через Telegram → собирает требования → пишет quote
4. После согласия — создаёт Trip (`POST /trips`) с status=draft + initial Itinerary
5. Клиент оплачивает → finance.payment.received → Trip.status: draft → paid (#160)
6. На startsAt: cron auto-transition Trip.status: paid → in_progress (#160)
7. На endsAt+1: cron Trip.status: in_progress → completed
8. После completed: feedback.requested cron → клиент пишет fidback

### Auth flow

1. Register: `POST /auth/register` → User создан → auth.user.registered event → WelcomeEmailListener
2. Login: `POST /auth/login` → email+password → 2FA challenge if enabled → access+refresh tokens
3. Refresh: `POST /auth/refresh` → rotation (старый session invalidated)
4. Suspicious detect: новая страна по IP → suspicious-login email + audit event
5. Logout: `POST /auth/logout` → session.revoked

### Push flow

1. Client subscribes: browser.pushManager.subscribe → frontend POST /comm/push/subscribe → PushSubscription
2. Backend triggers push: NotifyService.sendPush({userId, title, body, category}) → preferences check → PushService.sendToUser(userId) → WebPushProvider.deliver per subscription
3. Browser receives in service worker `push` event → showNotification → user clicks → openWindow(url)

## Cross-module rules

См. `docs/ARCH/MICROSERVICES.md`. Кратко:
- **Cross-module FK запрещены** — только soft-references (UUID без CONSTRAINT)
- **Cross-module calls** — через events bus или явный `<svc>.client.ts` SDK adapter
- **Privacy-by-default в outbox events** — никогда не публикуем PII в payload

## Стрелки (event-driven)

```
auth.user.registered → WelcomeEmailListener (notify.send 'welcome')
                    → ClientProfileService (auto-создание Client + Profile)

trips.created → TripStatusInitListener (initial draft state)
finance.payment.received → TripStatusService (transition draft → paid)

trips.status.changed (in_progress) → ScheduleService (notify клиенту "ваш тур начался")

feedback.received → AI signals enrichment (#189, future)

sos.triggered → SOSDispatcher (concierge ack within SLA, escalate, audit)
```

## Связанные документы

- `apps/api/prisma/schema.prisma` — фактическая модель
- `docs/ARCH/MICROSERVICES.md` — карта сервисов
- `docs/ARCH/EVENTS.md` — каталог событий
- `docs/ARCH/CATALOG.md` — детали Tour / TourDay
- `docs/UX/TOUR_LANDING.md` — UX of catalog landing
