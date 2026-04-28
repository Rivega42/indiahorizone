-- M5.B.009 — Password reset tokens (issue #134)
--
-- Plain-token (UUIDv4) попадает в email-ссылку. В БД — только argon2id-хеш.
-- Single-use: usedAt заполняется при confirmReset.
-- TTL 30 минут (expiresAt = createdAt + 30min).

CREATE TABLE "password_reset_tokens" (
  "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    UUID NOT NULL,
  "token_hash" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at"    TIMESTAMP(3),

  CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "idx_password_reset_tokens_user_active" ON "password_reset_tokens" ("user_id", "used_at");
CREATE INDEX "idx_password_reset_tokens_expires" ON "password_reset_tokens" ("expires_at");
