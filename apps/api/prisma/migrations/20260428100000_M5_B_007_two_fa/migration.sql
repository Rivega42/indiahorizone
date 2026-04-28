-- M5.B.007 — 2FA TOTP enrollment (issue #132)
--
-- Изменения:
-- 1. users — два новых поля: two_fa_enabled (default false), two_fa_secret (nullable)
-- 2. recovery_codes — новая таблица для 2FA fallback кодов

ALTER TABLE "users"
  ADD COLUMN "two_fa_enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "two_fa_secret" TEXT;

CREATE TABLE "recovery_codes" (
  "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    UUID NOT NULL,
  "code_hash"  TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "used_at"    TIMESTAMP(3),

  CONSTRAINT "recovery_codes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "recovery_codes_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Active codes per user (used_at IS NULL) — для быстрого поиска при verify
CREATE INDEX "idx_recovery_codes_user_active" ON "recovery_codes" ("user_id", "used_at");
