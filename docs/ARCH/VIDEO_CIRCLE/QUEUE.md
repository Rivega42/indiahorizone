# Кружок: очередь и оффлайн-доставка

> Закрывает [#65](https://github.com/Rivega42/indiahorizone/issues/65). Часть EPIC 6 [#57](https://github.com/Rivega42/indiahorizone/issues/57).
> Статус: Draft v0.1.

## Зачем

В Индии интернет нестабильный. Клиент записал кружок, нажал «отправить» — и потерял сеть. Очередь гарантирует:

- Кружок не теряется
- Пользователь не теряет в UX (видит «отправлено», даже если фактически в очереди)
- Не нужно вручную «пересылать»

## Локальная очередь

### iOS

`BGTaskScheduler` + локальная база (SQLite через GRDB или Core Data):

```swift
struct CircleQueueItem {
    let circleId: UUID
    let filePath: URL
    let metadata: CircleMetadata
    let attempts: Int
    let nextRetryAt: Date
    let idempotencyKey: UUID
}
```

### Android

`WorkManager` с `OneTimeWorkRequest` + Room database:

```kotlin
@Entity(tableName = "circle_queue")
data class CircleQueueItem(
    @PrimaryKey val circleId: UUID,
    val filePath: String,
    val metadataJson: String,
    val attempts: Int,
    val nextRetryAt: Long,
    val idempotencyKey: UUID
)
```

WorkManager имеет встроенные retry с backoff, использует.

### React Native

[`react-native-background-fetch`](https://github.com/transistorsoft/react-native-background-fetch) + общая SQLite-база.

## Retry-стратегия

Exponential backoff с jitter:

| Попытка | Задержка |
|---|---|
| 1 | сразу |
| 2 | 30 сек |
| 3 | 2 мин |
| 4 | 10 мин |
| 5 | 30 мин |
| 6 | 1 час |
| 7 | 2 часа |
| 8 | 6 часов |
| 9 | 24 часа |
| 10 | 24 часа |

После **10 попыток за 5 дней** — статус `failed`, в UI показываем кнопку «попробовать снова вручную».

Дедлайн: если поездка завершилась + 7 дней прошло — кружок помечается `expired`, не отправляется.

## Idempotency-key

При создании кружка генерируется UUIDv4 на устройстве и сохраняется в очереди.

Каждая попытка отправки идёт с одним и тем же `Idempotency-Key`. Сервер (`media-svc` + `feedback-svc`) проверяет:
- Если key уже обработан → возвращает 200 OK без действия (быстрый путь)
- Если новый → принимает и обрабатывает

Это защита от:
- Двойной отправки при моргании сети
- Потери ack от сервера

## Условия отправки

WorkManager / BGTaskScheduler учитывают:
- **Сеть:** только Wi-Fi или Wi-Fi + cellular (настройка пользователя)
- **Заряд:** > 20% или подключено к зарядке
- **Не низкий режим энергосбережения**

Пользователь может в настройках разрешить «отправлять только по Wi-Fi» — тогда 3G не используется (для тех, у кого роуминг дорогой).

## UI очереди

В Trip Dashboard виден индикатор:

```
[ Ваши кружки ]
☑ День 1 — отправлен
☑ День 2 — отправлен
🔄 День 3 — в очереди (попытка 2/10)
☐ День 4 — нет записи
```

Клиент может:
- Тапнуть «в очереди» → детали с прогресс-баром
- «Отправить сейчас» — форсирует попытку, минуя backoff
- «Удалить» — отменить (с подтверждением)

## Сценарий «нет места на устройстве»

Если SQLite/файлы > 100 МБ:
- Уведомление пользователю: «У вас 12 кружков в очереди (50 МБ). Подключитесь к Wi-Fi для отправки»
- Самый старый успешно отправленный — удаляется
- Если очередь > 50 кружков — блокируем новые до отправки старых

## Метрики

В `feedback-svc`:
- `circle.queue.size_p95` — размер очереди по перцентилям
- `circle.queue.delivery.duration` — от записи до ack сервера
- `circle.queue.failed.rate` — % failed после 10 попыток

## Acceptance criteria (#65)

- [x] Файл существует
- [x] Retry policy (exponential backoff, 10 попыток, deadline 5 дней)
- [x] Idempotency-key схема
- [x] UX очереди
- [x] Сценарий «нет места»
