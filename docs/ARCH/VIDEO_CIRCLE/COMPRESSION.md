# Кружок: сжатие на устройстве

> Закрывает [#64](https://github.com/Rivega42/indiahorizone/issues/64). Часть EPIC 6 [#57](https://github.com/Rivega42/indiahorizone/issues/57).
> Статус: Draft v0.1.

## Целевые параметры

Цель: 60-секундный кружок ≤ **5 МБ** после сжатия.

Это компромисс между:
- Качеством (нужно понимать эмоцию клиента)
- Скоростью загрузки (3G в Индии = 50–200 КБ/сек, надо < 60 сек на отправку)
- Хранением (5 МБ × 1000 поездок × 7 дней = ~35 ГБ; ок для S3)

## Расчёт битрейта

```
60 сек × (видео битрейт + аудио битрейт) ≤ 5 МБ × 8 = 40 Мбит
   ⇒ суммарный битрейт ≤ ~660 кбит/с

Распределение:
- Видео: 600 кбит/с (480p H.264 baseline)
- Аудио: 64 кбит/с (AAC mono 16 кГц)
```

## Технология

### iOS

`AVAssetExportSession` с пресетом `AVAssetExportPresetMediumQuality` или ручной:

```swift
let exportSession = AVAssetExportSession(
    asset: asset,
    presetName: AVAssetExportPresetMediumQuality
)
exportSession.outputFileType = .mp4
exportSession.outputURL = compressedURL
// + bitrate настройки через AVMutableComposition при необходимости
```

Альтернатива: `AVAssetWriter` для тонкого контроля битрейта.

### Android

`MediaCodec` API через библиотеку (например, [Mp4Composer-android](https://github.com/MasayukiSuda/Mp4Composer-android) или [LightCompressor](https://github.com/AbedElazizShe/LightCompressor)):

```kotlin
VideoCompressor.start(
    context = applicationContext,
    uris = listOf(srcUri),
    isStreamable = false,
    appSpecificStorageConfiguration = AppSpecificStorageConfiguration(
        videoName = "compressed_$circleId",
        subFolderName = "circles_compressed"
    ),
    configureWith = Configuration(
        quality = VideoQuality.MEDIUM,
        videoBitrateInMbps = 0.6,
        ...
    )
)
```

### React Native (если общая кодовая база)

[`react-native-compressor`](https://github.com/numandev1/react-native-compressor) — обёртка над нативным API:

```ts
const compressed = await Video.compress(
    sourceUri,
    {
        compressionMethod: 'manual',
        bitrate: 600_000,
        maxSize: 480,
    },
    (progress) => setProgress(progress)
)
```

## UX прогресса сжатия

1. После остановки записи — экран превью **сразу**, на background — компрессия
2. Если клиент жмёт «отправить» до конца компрессии — индикатор «сжимаем... 78%»
3. После завершения — кружок попадает в очередь
4. Прогресс ≤ 5 секунд на 60-секундное видео на iPhone 12+ / Pixel 5+

## Fallback для слабых устройств

Если устройство **не справляется** (старый Android, Android < 7):

- Опускаем качество до 360p, битрейт 400 кбит/с
- Если всё равно медленно — **отправляем без сжатия** (предупреждаем клиента: «загрузка может занять до 5 минут»)
- Логируем `circle.compression.fallback` для метрик

## Метрики

В `feedback-svc`:
- `circle.compression.duration_p95` — медиана и 95-й перцентиль времени сжатия
- `circle.compression.ratio` — во сколько раз уменьшился файл
- `circle.compression.fallback.rate` — % случаев fallback на 360p

## Acceptance criteria (#64)

- [x] Файл существует
- [x] Целевые параметры (≤5 МБ за 60 сек)
- [x] Выбор библиотек обоснован (нативные iOS/Android + RN-обёртка)
- [x] Fallback для слабых устройств
- [x] Метрики
