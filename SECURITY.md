# Безопасность

## Поддерживаемые версии

Проект в фазе 3 (pre-production). Поддерживается только текущий main.

## Сообщить об уязвимости

**Не публикуйте уязвимости в публичных issues.**

Если вы обнаружили уязвимость в IndiaHorizone:

1. Напишите на **security@indiahorizone.ru** с темой `[security] <короткое описание>`
2. ИЛИ воспользуйтесь GitHub **Private vulnerability reporting** в этом репозитории (Security tab → Report a vulnerability)
3. Включите:
   - Описание уязвимости
   - Шаги воспроизведения
   - Потенциальное влияние (что может сделать атакующий)
   - Ваши контакты для обратной связи

## Что мы обещаем

- **Подтверждение получения** — в течение 48 часов
- **Первоначальная оценка** — в течение 5 рабочих дней
- **Исправление критичных** (P0 — RCE, утечка ПДн, обход auth) — в течение 7 дней
- **Public disclosure** — по согласованию с reporter'ом, не раньше выкатки фикса

## Зона исследования

✅ В scope:
- `apps/api/` (NestJS backend)
- `apps/web/` (Next.js frontend, опубликован на indiahorizone.ru / dev-сервере)
- Workflows и infrastructure-as-code (`.github/`, `deploy/`)

❌ Вне scope:
- Сторонние сервисы (Mapbox, FCM, OpenAI и др.) — репортить им напрямую
- Вопросы безопасности юр.документов (ПДн compliance) — на legal@indiahorizone.ru
- Социальная инженерия / phishing — не интересно (но не делайте)

## Hall of Fame

После первого подтверждённого репорта — здесь появится список исследователей с их разрешения.

## Текущие меры безопасности

| Слой | Что сделано | Документация |
|---|---|---|
| **Auth** | Argon2id passwords + 2FA TOTP + recovery codes (argon2-хеш) + JWT с refresh-rotation + suspicious-login detector | `apps/api/src/modules/auth/` |
| **PII** | AES-256-GCM column-level encryption (firstName/lastName/dateOfBirth/phone) | `apps/api/src/common/crypto/` (#139) |
| **Audit** | Append-only audit log через Postgres trigger (UPDATE/DELETE blocked) | `docs/ARCH/EVENTS.md` (#218) |
| **Rate limit** | 4 профиля (auth/api/sos/media-upload) с Redis store | `apps/api/src/common/throttle/` (#221) |
| **HTTPS / TLS** | TLS 1.3+ обязательно (deploy via reverse proxy) | (Vика, deploy-config) |
| **Secrets** | `.env.example` для шаблона, real values в Vault (production) — никогда в git | `.gitignore` |
| **Dependencies** | Dependabot alerts + автообновление (планируется в `chore/repo-setup` PR) | `.github/dependabot.yml` |
| **Code scanning** | CodeQL через GitHub Advanced Security (планируется) | `.github/workflows/codeql.yml` |
| **152-ФЗ ПДн** | Cross-border консент в `/consent`, append-only audit, encryption at rest | `docs/LEGAL/PDN.md`, `/privacy`, `/consent` |

## Принципы

- **Privacy-by-default в outbox events** — никогда не публикуем в bus payload персональные данные (email, phone, body сообщений). Видно из event'а: «была отправлена нотификация N user'у X», но не «было отправлено `{password}`».
- **Минимум привилегий** — service accounts только с нужными правами.
- **Defence in depth** — если один слой пробит (например, SQL-injection), encryption-at-rest защищает PII.
- **No-blame post-mortem** — после инцидента: что произошло, что чинить, как предотвратить — без поиска виноватых.

## Связанные документы

- `docs/ARCH/SECURITY/` — архитектура безопасности
- `docs/LEGAL/PDN.md` — 152-ФЗ обработка ПДн
- `CLAUDE.md` § Безопасность
