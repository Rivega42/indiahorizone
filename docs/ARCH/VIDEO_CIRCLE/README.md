# Кружок — индекс и production-аспекты

> **Статус:** Draft v0.1. Часть EPIC 6 [#57](https://github.com/Rivega42/indiahorizone/issues/57).
> **Owner:** Roman.

## Зачем кружок — first-class citizen

Кружок (видео-фидбэк до 60 сек) — ключевая UGC-механика IndiaHorizone (см. [`docs/UX/VIDEO_CIRCLE.md`](../../UX/VIDEO_CIRCLE.md), [`docs/JTBD.md` § J-C4](../../JTBD.md), [`docs/LOYALTY/UGC.md`](../../LOYALTY/UGC.md)).

Из-за специфики:
- Запись на нестабильной сети в Индии
- Размер ~10–30 МБ за 60 сек до сжатия
- Чувствительные ПДн (лицо клиента)
- Целевой % заполнения ≥ 60% — то есть фича должна работать **очень** надёжно

— она получает отдельную инфраструктуру, отдельный пайплайн обработки и отдельные SLA.

## Документы

| Документ | Что внутри |
|---|---|
| [`RECORDING.md`](./RECORDING.md) | Запись: формат, разрешение, длительность, UX |
| [`COMPRESSION.md`](./COMPRESSION.md) | Сжатие на устройстве + транскод серверный |
| [`QUEUE.md`](./QUEUE.md) | Локальная очередь, retry, idempotency |
| [`DELIVERY.md`](./DELIVERY.md) | Загрузка в S3 (chunked, resumable) |
| [`PLAYBACK.md`](./PLAYBACK.md) | Воспроизведение (variants, autoplay, accessibility) |

## Pipeline (end-to-end)

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   RECORDING  │ → │  COMPRESSION │ → │    QUEUE     │
│ (на устр-ве) │   │ (на устр-ве) │   │ (локальная)  │
└──────────────┘   └──────────────┘   └──────┬───────┘
                                             ↓
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   PLAYBACK   │ ← │   DELIVERY   │ ← │ media-svc    │
│ (Trip Dash)  │   │ (S3 multi-   │   │ + transcode  │
│              │   │ part)         │   │  (FFmpeg)    │
└──────────────┘   └──────────────┘   └──────────────┘
```

## Production SLA

| SLA | Target |
|---|---|
| От «нажать запись» до начала захвата | ≤ 500 мс |
| От «остановить» до видимости в очереди | ≤ 200 мс |
| От загрузки в S3 до finalize | ≤ 30 сек на 25 МБ при 4G |
| От finalize до доступности в playback | ≤ 60 сек (включая транскод) |
| Доля кружков, успешно доставленных в течение поездки | ≥ 99% |
| Доля «expired» (умершие в очереди) | ≤ 1% |

> **Рекомендация:** запись начинается **до** того, как пользователь увидел готовый UI (preroll buffer 200 мс). **Почему важно:** клиент в travel-моменте — эмоциональный, и если первые слова потерялись («не записало!»), он не повторит. Тонкая прединициализация камеры — разница между 30% и 60% conversion.

## Связь с архитектурой

| Этап | Какой модуль |
|---|---|
| Запись + сжатие на устройстве | mobile/web (см. RECORDING/COMPRESSION) |
| Выдача presigned URL | `media-svc` `POST /media/upload-url` |
| Загрузка | прямой PUT в S3 (минуя backend) |
| Finalize | `media-svc` `POST /media/:id/finalize` |
| Транскод | `media-svc` → FFmpeg lambda |
| Привязка к feedback | `feedback-svc` слушает `media.upload.completed` |
| Playback | CDN signed URL → `media-svc` |

> **Рекомендация:** загрузка в S3 идёт **минуя наш backend**. **Почему важно:** видео 25 МБ через NestJS = либо memory pressure, либо stream-handling, что увеличивает риск падения. Presigned URL → клиент пишет сразу в S3 → нагрузка на backend нулевая. Backend только подтверждает finalize-эвент.

## Безопасность

| Угроза | Защита |
|---|---|
| Перехват видео в сети | TLS 1.3 для всех endpoints; signed URLs с TTL |
| Доступ к чужому видео | `media_assets.owner_id` + RBAC проверка на каждом запросе |
| Скачивание из S3 без auth | Bucket private, доступ только через signed URL с TTL ≤ 1 час |
| Использование без согласия | `consent_video_use` обязателен на загрузку (см. [`docs/LEGAL/CONSENTS/PHOTO_VIDEO.md`](../../LEGAL/CONSENTS/PHOTO_VIDEO.md)) |
| Отзыв согласия | Каскадное удаление публичных ссылок при `clients.consent.revoked` |

## Граничные случаи

| Случай | Поведение |
|---|---|
| Запись пропала из-за сбоя устройства | Локальная очередь не теряется (persistent storage), at next launch продолжается |
| Поездка отменена/завершена, очередь не пуста | До 7 дней после `trips.completed` отправляем; затем `expired` |
| Согласие отозвано до отправки | Очередь чистится, видео удаляется локально |
| Кружок > 60 сек по ошибке | Сжатие усекает или предлагает обрезать пользователю |
| Сторадж устройства полон | Уведомление + возможность удалить старые отправленные |

## Метрики

В Prometheus:
- `circle.recording.duration{outcome=success/cancelled/error}`
- `circle.compression.size_ratio` — насколько сжали
- `circle.queue.size_p95`
- `circle.upload.duration_p95{network}`
- `circle.transcode.duration_p95`
- `circle.playback.start.latency_p95`
- `circle.delivery.success_rate` — % доставленных от записанных
- `circle.expired.count` — умершие

В Grafana — отдельный дашборд «Кружок» с бизнес- и техническими метриками рядом.

## Что НЕ делаем в фазе 3

- Realtime-стриминг (WebRTC) — только запись + загрузка
- Live-broadcast «гид → клиент» — отдельная история, не нужна
- AI-анализ настроения по видео — фаза 4 (после набора датасета)
- Auto-перевод на английский — только если попросит founder

## Acceptance criteria

- [x] Индекс с пайплайном
- [x] Production SLA-цели
- [x] Связь с другими модулями
- [x] Безопасность и согласия
- [x] Граничные случаи
- [x] Метрики
- [x] Negative space
