-- Migration: M5.C.002 — PDN column-level encryption
-- Issue: #139
-- Depends on: #138 (clients + client_profiles tables)
--
-- Что меняется:
-- - client_profiles.date_of_birth: DATE → TEXT (хранит ISO 'YYYY-MM-DD'
--   зашифрованный AES-256-GCM как base64-строка).
--
-- На момент миграции таблица client_profiles пустая (фаза 3 bootstrap),
-- поэтому ALTER TYPE без USING конвертора безопасен. Если в будущем
-- придёт миграция с данными — добавить `USING date_of_birth::TEXT`.
--
-- Шифрование выполняется на уровне приложения (CryptoService) при
-- write/update через утилиты в apps/api/src/modules/clients/lib/profile-encryption.ts.
-- Postgres ничего не знает про encryption — для него это просто TEXT.

ALTER TABLE "client_profiles"
  ALTER COLUMN "date_of_birth" TYPE TEXT
  USING "date_of_birth"::TEXT;
