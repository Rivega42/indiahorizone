-- M5.B.003 hotfix — Sessions table (login + refresh + logout)
--
-- Backfill: Session model был добавлен в schema.prisma в #128 (login + JWT)
-- но миграция CREATE TABLE для него никогда не была сгенерирована. На staging
-- /login падал с «table sessions does not exist» (см. отчёт Вики по issue #329).
--
-- Этот hotfix дополняет 0_init без изменений в применённой схеме где table уже
-- была создана вручную (через Прислугу-Вику). Идемпотентность через IF NOT EXISTS,
-- чтобы повторный применение на dev'е не упало.

CREATE TABLE IF NOT EXISTS "sessions" (
  "id"                 UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id"            UUID NOT NULL,
  "refresh_token_hash" TEXT NOT NULL,
  "ip"                 TEXT,
  "user_agent"         TEXT,
  "created_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at"         TIMESTAMP(3) NOT NULL,
  "revoked_at"         TIMESTAMP(3),
  "revoke_reason"      TEXT,

  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_sessions_user_active" ON "sessions" ("user_id", "revoked_at");
CREATE INDEX IF NOT EXISTS "idx_sessions_expires_ttl" ON "sessions" ("expires_at");
