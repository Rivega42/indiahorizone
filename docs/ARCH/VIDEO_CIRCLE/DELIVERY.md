# Кружок: доставка на сервер

> Закрывает [#66](https://github.com/Rivega42/indiahorizone/issues/66). Часть EPIC 6 [#57](https://github.com/Rivega42/indiahorizone/issues/57).
> Статус: Draft v0.1.

## Поток

```
Устройство → Gateway → media-svc → S3 (RU-облако) → событие → feedback-svc
```

## Multipart upload

Прямая загрузка в S3 через **signed URL** от `media-svc`:

### Шаги

1. Клиент: `POST /v1/circles/init` с метаданными
   ```json
   {
       "circle_id": "<uuid>",
       "trip_id": "...",
       "size_bytes": 2840000,
       "duration_sec": 47,
       "consent": {...}
   }
   ```
2. `media-svc` валидирует (доступ клиента к этой поездке, лимиты, согласие, AML — нет странных размеров)
3. `media-svc` генерирует **S3 multipart upload signed URLs** (по 5 МБ chunks)
4. Возвращает клиенту:
   ```json
   {
       "upload_id": "<s3-multipart-id>",
       "parts": [
           { "part": 1, "url": "https://s3.ru-central1...?X-Amz-Signature=..." }
       ],
       "complete_url": "..."
   }
   ```
5. Клиент загружает каждый part напрямую в S3 (gateway не проксирует медиа)
6. По завершении — клиент шлёт `POST /v1/circles/{id}/complete` с этой информацией
7. `media-svc` завершает multipart, проверяет SHA-256 хеш
8. Публикует событие `circle.uploaded` в Kafka
9. `feedback-svc` consume → создаёт фидбэк-запись, привязанную к кружку

## Resumable uploads

S3 multipart позволяет:
- Если потеряли сеть на 70% загрузки — продолжаем с части 8/10, не сначала
- Список загруженных частей запоминается на устройстве
- TTL multipart upload в S3: **24 часа** (потом auto-abort)

Альтернатива (если уйдём от S3 на свой сервер): TUS protocol.

## RU-облако

Согласно [`docs/LEGAL/PDN.md`](../../LEGAL/PDN.md), [#49](https://github.com/Rivega42/indiahorizone/issues/49):

| Параметр | Значение |
|---|---|
| Провайдер | Yandex Object Storage (или Selectel) |
| Регион | `ru-central1` |
| Bucket | `ih-circles-prod` |
| Шифрование at-rest | SSE-KMS на уровне bucket |
| Доступ | server-side: `media-svc` через IAM-роль |

Bucket policy:
- Public read **запрещён**
- Доступ на чтение только через signed URL от `media-svc`
- Срок действия signed URL для просмотра: 1 час
- Загрузка только через signed URL от `media-svc` (PUT с `X-Amz-Signature`)

## Lifecycle policy

| Возраст файла | Действие |
|---|---|
| 0–7 дней | hot, оригинал в standard класс |
| 8–30 дней | в IA (infrequent access) — экономия |
| 31–90 дней | в Glacier — архив |
| > 90 дней с момента возвращения клиента | удаление по retention policy ([`docs/LEGAL/PDN.md`](../../LEGAL/PDN.md)) |

Транскодированные HLS-варианты ([`PLAYBACK.md`](./PLAYBACK.md)) — отдельный bucket, retention то же.

## Метаданные на стороне сервера

`media-svc` хранит в `media_db.circles`:

```sql
CREATE TABLE circles (
    circle_id UUID PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(trip_id),
    user_id UUID NOT NULL,
    s3_key TEXT NOT NULL,
    size_bytes BIGINT,
    duration_sec INT,
    sha256 BYTEA,
    recorded_at TIMESTAMPTZ,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    consent JSONB,
    geo POINT,
    deleted_at TIMESTAMPTZ
);
```

Удаление по retention или по запросу клиента (152-ФЗ право на забвение):
- `s3:DeleteObject` на оригинал и все варианты
- `UPDATE circles SET deleted_at = NOW(), s3_key = NULL`
- В audit-svc запись о удалении

## Безопасность

- Загрузка только аутентифицированным клиентом (JWT)
- Signed URL — короткий TTL (15 мин на upload part)
- Server-side проверка SHA-256 хеша
- Размер файла проверяется (≤ 50 МБ — анти-злоупотребление)
- Rate limit: **10 кружков в час на клиента** (защита от автоматизации)

## Acceptance criteria (#66)

- [x] Файл существует
- [x] Resumable upload через S3 multipart
- [x] Lifecycle policy (hot→IA→Glacier→delete)
- [x] Соответствие 152-ФЗ (RU-облако, signed URL, audit)
- [x] Безопасность (rate limit, hash, signed)
