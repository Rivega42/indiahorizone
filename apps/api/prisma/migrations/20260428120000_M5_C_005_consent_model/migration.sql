-- M5.C.005 — Consent модель (issue #142)
--
-- 4 типа согласий: pdn / photo_video / geo / emergency_contacts.
-- Один активный consent на (client, type) обеспечивается partial unique index'ом —
-- Prisma ещё не поддерживает partial unique нативно, делаем raw SQL.

CREATE TYPE "consent_type" AS ENUM ('pdn', 'photo_video', 'geo', 'emergency_contacts');

CREATE TABLE "consents" (
  "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
  "client_id"  UUID NOT NULL,
  "type"       "consent_type" NOT NULL,
  "scope"      JSONB NOT NULL,
  "version"    TEXT NOT NULL,
  "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revoked_at" TIMESTAMP(3),

  CONSTRAINT "consents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "consents_client_id_fkey" FOREIGN KEY ("client_id")
    REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "idx_consents_client_type" ON "consents" ("client_id", "type");
CREATE INDEX "idx_consents_client_active" ON "consents" ("client_id", "revoked_at");

-- Partial unique index: один активный consent на (client, type).
-- Если revokedAt IS NULL → запись активна → дубль на тот же (client, type) запрещён.
-- Revoked consents (revokedAt NOT NULL) — audit-trail, могут повторяться.
CREATE UNIQUE INDEX "uq_consents_client_type_active"
  ON "consents" ("client_id", "type")
  WHERE "revoked_at" IS NULL;
