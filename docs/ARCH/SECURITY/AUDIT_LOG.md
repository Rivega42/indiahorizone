# Security: audit-log

> Закрывает [#71](https://github.com/Rivega42/indiahorizone/issues/71). Часть EPIC 6 [#57](https://github.com/Rivega42/indiahorizone/issues/57).
> Статус: Draft v0.1.

## Что логируем

| Событие | Уровень | Кто пишет |
|---|---|---|
| Логин (успех / неудача) | INFO / WARN | identity-svc |
| Изменение пароля | INFO | identity-svc |
| Включение / отключение 2FA | INFO | identity-svc |
| Изменение роли пользователя | WARN | identity-svc + admin-svc |
| Просмотр паспорта клиента | INFO | clients-svc |
| Изменение паспорта клиента | WARN | clients-svc |
| Просмотр чужой карточки клиента | INFO (для не-admin), WARN (для admin) | clients-svc |
| Финансовая транзакция | INFO | finance-svc |
| Выплата гиду | INFO | finance-svc |
| Ручная корректировка финданных | WARN | finance-svc |
| Удаление клиента / ПДн | WARN | clients-svc |
| Срабатывание SOS | INFO | sos-svc |
| Закрытие SOS | INFO | sos-svc |
| Доступ к секрету (Lockbox) | INFO | YC Audit Trails → audit-svc |
| Изменение конфигурации сервиса | WARN | каждый сервис |
| Доступ admin к чужому аккаунту | WARN | identity-svc |

## Формат записи

JSON, структурированный:

```json
{
    "id": "<ulid>",
    "ts": "2026-04-25T10:23:45.123Z",
    "level": "INFO",
    "service": "clients-svc",
    "event": "client.passport.viewed",
    "actor": {
        "user_id": "<uuid>",
        "role": "concierge",
        "ip": "203.0.113.42",
        "user_agent": "..."
    },
    "subject": {
        "type": "client",
        "id": "<uuid>"
    },
    "context": {
        "request_id": "<trace-id>",
        "session_id": "<session>",
        "shift_id": "<concierge-shift-id>"
    },
    "metadata": {}
}
```

## Хранилище

### Сервис `audit-svc`

Отдельный микросервис. Только пишет (через Kafka events `audit.*`) и читает (для search и compliance).

### БД

PostgreSQL (`audit_db`), таблица `audit_events`:

```sql
CREATE TABLE audit_events (
    id ULID PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL,
    level TEXT NOT NULL,
    service TEXT NOT NULL,
    event TEXT NOT NULL,
    actor JSONB,
    subject JSONB,
    context JSONB,
    metadata JSONB
);

CREATE INDEX ON audit_events (ts DESC);
CREATE INDEX ON audit_events (service, event);
CREATE INDEX ON audit_events ((subject->>'id'));
CREATE INDEX ON audit_events ((actor->>'user_id'));
```

### Append-only

Жёсткое правило: **никаких UPDATE / DELETE**. Только INSERT.

Реализация:
- DB-триггер на `audit_events` блокирует UPDATE / DELETE
- Роль `audit-writer` имеет только INSERT
- Роль `audit-reader` — только SELECT

### Архив

Записи старше **90 дней** → автоматически экспортируются в S3 (RU-облако), сжатые в `parquet.gz`.

В Postgres хранятся только последние 90 дней (для быстрых запросов).

## Retention

| Категория | Срок |
|---|---|
| Audit финансовых операций | **5 лет** (налоговый учёт) |
| Audit ПДн (просмотр/изменение) | **3 года** (152-ФЗ) |
| Audit SOS | **3 года** |
| Audit auth (login, 2FA) | **1 год** |
| Audit конфигурации | **1 год** |

WORM на бэкапах S3 — настройка bucket с object lock в режиме compliance (не позволяет удалить раньше срока даже admin-у YC).

## Поиск и расследование

UI для admin:

- Фильтры: дата, сервис, событие, actor, subject
- Полнотекстовый поиск (Postgres `tsvector` или OpenSearch)
- Экспорт результата в CSV для регулятора

Типичные сценарии:
- «Кто смотрел паспорт клиента X за прошлый месяц»
- «Кто из concierge смотрел клиентов вне своих смен»
- «Кто отключил 2FA за последний год»
- «Все финансовые транзакции > ₽1 млн за квартал»

## Защита самого audit-svc

- Доступ на чтение audit — только admin (с 2FA)
- Доступ на чтение собственных audit-записей — concierge / sales / гид (только своих)
- Дублирующая копия audit в **отдельном облачном аккаунте** (cross-account write) — защита от ситуации «admin удалил всё, чтобы скрыть»

## Acceptance criteria (#71)

- [x] Файл существует
- [x] Список событий логируется (16+)
- [x] Retention policy по категориям
- [x] Поиск по фильтрам и фуллтекст
- [x] Append-only гарантия
