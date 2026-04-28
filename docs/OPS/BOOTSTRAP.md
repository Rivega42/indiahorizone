# Bootstrap admin пользователя в dev/staging

Runbook для Вики (devops AI). Контекст: после первого деплоя `apps/api` БД пуста, в `/login` войти нечем. Этот скрипт создаёт первого admin'а из ENV-переменных, переданных только на момент запуска.

> **Issue:** #328 (Claude — код), #329 (Vika — compose).
> **Принцип:** пароль НИКОГДА не оказывается на диске сервера и в git. Только в shell-сессии Вики на момент запуска.

## Когда запускать

- Один раз после первого `prisma migrate deploy` на новом окружении (dev/staging).
- Повторно — для **ротации пароля** того же admin'а (role не меняется).
- В CI — безопасно, без env скрипт делает `exit 0` (no-op).

## Предусловия

- `apps/api` контейнер собран (через `docker compose build api`)
- `prisma migrate deploy` выполнен (таблица `users` существует)
- Вика получила от Roman'а:
  - **email** через любой канал (не секрет)
  - **password ≥ 12 символов** через secure канал (Telegram «Секретный чат», Bitwarden Send, или out-of-band)

## Запуск

```bash
cd /opt/indiahorizone

# Roman диктует пароль — Вика читает с -s (no echo, история не сохраняется)
read -s ADMIN_BOOTSTRAP_PASSWORD
export ADMIN_BOOTSTRAP_PASSWORD
export ADMIN_BOOTSTRAP_EMAIL=roman@indiahorizone.ru   # пример

docker compose --env-file .env -f docker-compose.dev.yml run --rm \
  -e ADMIN_BOOTSTRAP_EMAIL \
  -e ADMIN_BOOTSTRAP_PASSWORD \
  api pnpm --filter @indiahorizone/api db:seed:admin

# КРИТИЧНО: сразу очищаем env и историю
unset ADMIN_BOOTSTRAP_EMAIL ADMIN_BOOTSTRAP_PASSWORD
history -c
```

## Ожидаемый вывод

При первом запуске:
```
✓ [seed:admin] admin created: roman@indiahorizone.ru
```

При повторном запуске (ротация пароля):
```
✓ [seed:admin] password updated for roman@indiahorizone.ru (role=admin, status=active — unchanged)
```

Без env (smoke test):
```
[seed:admin] ADMIN_BOOTSTRAP_* не заданы — пропускаю (no-op)
```

## Проверки

После успешного запуска:

```bash
# 1. User в БД появился
docker compose --env-file .env -f docker-compose.dev.yml exec postgres \
  psql -U indiahorizone -d indiahorizone \
  -c "select email, role, status, created_at from users;"

# 2. Roman логинится через API
curl -X POST http://localhost:3011/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"roman@indiahorizone.ru","password":"ТОТ-САМЫЙ-ПАРОЛЬ"}'
# Ожидаем 200 + { accessToken, refreshToken }

# 3. Roman в браузере
# http://2.56.241.126:3010/login → email + password → /trips
```

## Если упало

| Ошибка | Причина | Действие |
|---|---|---|
| `пароль слишком короткий` | < 12 символов | попроси Roman'а длиннее |
| `пароль слишком слабый (zxcvbn score N < 2)` | очевидный паттерн (`IndiaHorizone2026`, `password123`) | попроси непредсказуемее, лучше из менеджера паролей |
| `ADMIN_BOOTSTRAP_EMAIL некорректен` | опечатка | проверь, что нет лишних пробелов и знаков |
| `Can't reach database server` | postgres не поднят / DATABASE_URL кривой | `docker compose ps`, проверь `.env` |
| `Could not load schema from prisma/schema.prisma` | image не собрался с prisma директорией | re-build: `docker compose build api --no-cache` |

## Что НЕ делать

> **Не клади ADMIN_BOOTSTRAP_PASSWORD в `.env` или `docker-compose.yml`.** Файл попадёт в `docker logs`, в backup, в snapshot диска. Ключ admin'а — root-доступ ко всему стэку. **Эфемерное окружение shell-а — единственное место, где этот пароль допустимо иметь.**

> **Не пиши пароль в комментариях issue / PR / Telegram-каналах.** Если Roman прислал пароль не в защищённом канале — попроси сменить и пришли заново через secure канал.

> **Не запускай скрипт с дефолтным паролем «для теста»** (вроде `Admin12345!`). Dev-сервер `2.56.241.126:3010` доступен из интернета — Shodan-боты ловят дефолты за минуты. Лучше пропустить bootstrap, чем оставить дефолт.

## Будущее

- **Production** — отдельный runbook когда дойдём до prod-инфры (Vault / KMS вместо ENV).
- **Invitation flow** для остальных ролей (manager, finance, concierge, guide) — issue #134 (password reset через email = тот же механизм для invite). После него seed нужен только для первого admin'а; всех остальных Roman приглашает из ЛК.
- **Slim-runner** Dockerfile вместо текущего «весь монорепо в runner» — отдельный issue фазы 4.

## Ссылки

- Скрипт: `apps/api/prisma/seed/admin.ts`
- Issue: [#328 M5.B.13 seed admin](https://github.com/Rivega42/indiahorizone/issues/328)
- Compose-issue: [#329 [devops:vika] api+postgres+redis](https://github.com/Rivega42/indiahorizone/issues/329)
- Argon2 параметры: `apps/api/src/modules/auth/services/password.service.ts:9`
