# Slice F — media-svc + кружок production

> Goal: «Клиент записывает кружок одним тапом, очередь на устройстве, S3-загрузка минуя backend, FFmpeg-транскод, playback в дневнике поездки».
> Покрывает [`USER_STORIES.md` US-CL-6](../../USER_STORIES.md), [`docs/UX/VIDEO_CIRCLE.md`](../../UX/VIDEO_CIRCLE.md), [`docs/ARCH/VIDEO_CIRCLE/`](../../ARCH/VIDEO_CIRCLE/).

## IH-M5-F-001 — feat(media): модель MediaAsset + S3 интеграция

- **Type:** feat — **Estimate:** 5h — **Owner:** backend — **Deps:** A-006
- **Acceptance:**
  - [ ] `MediaAsset` (id, ownerId, kind: photo|video|circle|document, mimeType, size, s3Key, status: pending|uploaded|transcoded|failed, createdAt)
  - [ ] S3 client (Cloudflare R2 / MinIO для dev)
  - [ ] Bucket private, no public ACLs
  - [ ] Server-side encryption (SSE-S3)
- **Files:** `apps/api/src/modules/media/*`, миграция
- **Labels:** `area:media`, `slice:F`, `priority:p0`, `type:feat`

## IH-M5-F-002 — feat(media): presigned upload URL

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** F-001
- **Acceptance:**
  - [ ] `POST /media/upload-url` принимает `{kind, mimeType, size}` → возвращает `{mediaId, putUrl, expiresAt}`
  - [ ] Создаёт MediaAsset со status=`pending`
  - [ ] Putobject conditions: max size, mime whitelist
  - [ ] TTL URL — 30 минут
  - [ ] Публикует `media.upload.started`
- **Files:** `apps/api/src/modules/media/upload.service.ts`
- **Labels:** `area:media`, `slice:F`, `priority:p0`, `type:feat`

## IH-M5-F-003 — feat(media): finalize endpoint

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** F-002
- **Acceptance:**
  - [ ] `POST /media/:id/finalize` принимает `{idempotencyKey}` (от устройства)
  - [ ] Проверяет, что объект в S3 существует, размер совпадает
  - [ ] Status → `uploaded`
  - [ ] Публикует `media.upload.completed`
  - [ ] Idempotent через `Idempotency-Key`
- **Files:** `apps/api/src/modules/media/upload.service.ts`
- **Labels:** `area:media`, `slice:F`, `priority:p0`, `type:feat`

## IH-M5-F-004 — feat(media): FFmpeg-транскод (lambda / worker)

- **Type:** feat — **Estimate:** 8h — **Owner:** backend — **Deps:** F-003
- **Acceptance:**
  - [ ] Worker подписан на `media.upload.completed` (kind=circle|video)
  - [ ] FFmpeg: H.264 + AAC, 720p и 480p variants для кружка
  - [ ] Результат в S3 `transcoded/<mediaId>/<variant>.mp4`
  - [ ] Публикует `media.transcode.completed` с массивом variants
  - [ ] При ошибке — `media.transcode.failed` + retry (3 раза)
- **Files:** `apps/api/src/modules/media/transcode.worker.ts`, `infra/ffmpeg/Dockerfile`
- **Labels:** `area:media`, `slice:F`, `priority:p0`, `type:feat`
- **Notes:** В фазе 3 — inProcess worker. В фазе 4 — separate AWS Lambda / Modal / самодельный pool. См. [`COMPRESSION.md`](../../ARCH/VIDEO_CIRCLE/COMPRESSION.md).

## IH-M5-F-005 — feat(media): signed URL для playback

- **Type:** feat — **Estimate:** 3h — **Owner:** backend — **Deps:** F-004
- **Acceptance:**
  - [ ] `GET /media/:id` проверяет ownership + RBAC
  - [ ] Возвращает `{variants: [{quality, signedUrl, expiresAt}]}`
  - [ ] TTL URL — 1 час
  - [ ] Не возвращает signed URL если consent revoked для kind=circle и target=public
- **Files:** `apps/api/src/modules/media/media.controller.ts`
- **Labels:** `area:media`, `slice:F`, `priority:p0`, `type:feat`

## IH-M5-F-006 — feat(media): retention + удаление

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** F-001
- **Acceptance:**
  - [ ] `DELETE /media/:id` — soft-delete (status=`deleted`, S3-объект остаётся 7 дней)
  - [ ] После 7 дней — фактическое удаление из S3
  - [ ] При `clients.consent.revoked` (photo_video) — каскадно удалить публичные ссылки и kind=circle
  - [ ] Публикует `media.deleted`
- **Files:** `apps/api/src/modules/media/retention.scheduler.ts`
- **Labels:** `area:media`, `slice:F`, `priority:p1`, `type:feat`

## IH-M5-F-007 — feat(web): кружок — запись через MediaRecorder API

- **Type:** feat — **Estimate:** 10h — **Owner:** frontend — **Deps:** A-011
- **Acceptance:**
  - [ ] Компонент `<CircleRecorder/>` использует `getUserMedia({video: true, audio: true})`
  - [ ] Frontal camera default
  - [ ] Запись 60 сек max с countdown
  - [ ] Hold-to-record или tap-start/tap-stop (UX-выбор — wireframe в [`UX/VIDEO_CIRCLE.md`](../../UX/VIDEO_CIRCLE.md))
  - [ ] Preroll 200ms (см. `VIDEO_CIRCLE/RECORDING.md`)
  - [ ] Превью после записи + retake
  - [ ] Работает в Safari iOS 15+ и Chrome Android
- **Files:** `apps/web/components/circle/recorder/*`
- **Labels:** `area:web`, `slice:F`, `priority:p0`, `type:feat`

## IH-M5-F-008 — feat(web): локальное сжатие на устройстве

- **Type:** feat — **Estimate:** 8h — **Owner:** frontend — **Deps:** F-007
- **Acceptance:**
  - [ ] Использовать `MediaRecorder` opts: `videoBitsPerSecond: 1_500_000`, `mimeType: 'video/webm; codecs=vp9'` (или mp4 для Safari)
  - [ ] Целевой размер 60-сек кружка ≤ 12 МБ
  - [ ] Fallback для старых браузеров — без сжатия + warning
- **Files:** `apps/web/components/circle/compress.ts`
- **Labels:** `area:web`, `slice:F`, `priority:p0`, `type:feat`
- **Notes:** См. [`COMPRESSION.md`](../../ARCH/VIDEO_CIRCLE/COMPRESSION.md).

## IH-M5-F-009 — feat(web): локальная очередь кружков (IndexedDB)

- **Type:** feat — **Estimate:** 8h — **Owner:** frontend — **Deps:** F-007, A-013
- **Acceptance:**
  - [ ] Dexie таблица `circle_queue` (см. `QUEUE.md`)
  - [ ] Запись блобом сохраняется немедленно
  - [ ] Background-sync (Service Worker) пытается отправить при наличии сети
  - [ ] Exponential backoff (см. ARCH/VIDEO_CIRCLE/QUEUE.md retry-таблица)
  - [ ] UI: список кружков со статусами (отправлен / в очереди / failed)
- **Files:** `apps/web/lib/circle-queue/*`
- **Labels:** `area:web`, `slice:F`, `priority:p0`, `type:feat`

## IH-M5-F-010 — feat(web): chunked upload в S3

- **Type:** feat — **Estimate:** 8h — **Owner:** frontend — **Deps:** F-002, F-009
- **Acceptance:**
  - [ ] Multipart upload через S3 если файл > 5 МБ
  - [ ] Параллельные части (3 одновременно)
  - [ ] Resumable: сохраняет uploadId + uploaded parts в IndexedDB
  - [ ] При reconnect продолжает с последней успешной части
  - [ ] Idempotency-Key одинаковый для всех retry
- **Files:** `apps/web/lib/circle-queue/upload.ts`
- **Labels:** `area:web`, `slice:F`, `priority:p0`, `type:feat`
- **Notes:** См. [`DELIVERY.md`](../../ARCH/VIDEO_CIRCLE/DELIVERY.md).

## IH-M5-F-011 — feat(web): playback кружка в дневнике

- **Type:** feat — **Estimate:** 5h — **Owner:** frontend — **Deps:** F-005
- **Acceptance:**
  - [ ] `<CirclePlayer/>` использует HLS или MP4-variants
  - [ ] Адаптивная битрейт-нагрузка (выбор variant по сети)
  - [ ] Автоплей mute по умолчанию (по policies браузеров)
  - [ ] Аккессибилити: subtitles slot (для будущего)
- **Files:** `apps/web/components/circle/player/*`
- **Labels:** `area:web`, `slice:F`, `priority:p0`, `type:feat`
- **Notes:** См. [`PLAYBACK.md`](../../ARCH/VIDEO_CIRCLE/PLAYBACK.md).

## IH-M5-F-012 — feat(web): экран дневника поездки

- **Type:** feat — **Estimate:** 6h — **Owner:** frontend — **Deps:** F-011, D-008
- **Acceptance:**
  - [ ] `/trips/:id/diary` — таймлайн дней с фото и кружками (если есть)
  - [ ] Возможность поделиться приватной ссылкой
  - [ ] Микро-проверка перед публикацией каждого материала (см. `LEGAL/CONSENTS/PHOTO_VIDEO.md`)
- **Files:** `apps/web/app/trips/[id]/diary/*`
- **Labels:** `area:web`, `slice:F`, `priority:p1`, `type:feat`

## IH-M5-F-013 — test(media): e2e кружок end-to-end

- **Type:** test — **Estimate:** 6h — **Owner:** qa — **Deps:** F-012
- **Acceptance:**
  - [ ] Сценарий: запись 30 сек → preview → отправить → видно в дневнике через ≤ 60 сек
  - [ ] Сценарий: airplane mode → запись → reconnect → авто-доставка
  - [ ] Сценарий: idempotency — двойной отправка → один результат
  - [ ] Сценарий: revoke consent photo_video → media удалена через 14 дней
- **Files:** `apps/web/tests/circle.spec.ts`
- **Labels:** `area:media`, `slice:F`, `priority:p0`, `type:test`

## Slice F — итог

13 issues, ≈ 79 часов (≈ 2 недели).

**DoD:** клиент записывает и отправляет кружок, файл доходит даже на нестабильной сети, видно в дневнике, согласия и удаление работают.
