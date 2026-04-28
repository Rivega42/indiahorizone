-- M5.C.007 — EmergencyContact модель (issue #144)
--
-- Контакты экстренной связи: максимум 2 на клиента (primary + secondary)
-- через unique constraint на (client_id, priority).

CREATE TYPE "emergency_contact_priority" AS ENUM ('primary', 'secondary');

CREATE TABLE "emergency_contacts" (
  "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
  "client_id"  UUID NOT NULL,
  "name"       TEXT NOT NULL,
  "phone"      TEXT NOT NULL,
  "relation"   TEXT NOT NULL,
  "language"   CHAR(2) NOT NULL,
  "priority"   "emergency_contact_priority" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "emergency_contacts_client_id_fkey" FOREIGN KEY ("client_id")
    REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "uq_emergency_contacts_client_priority"
  ON "emergency_contacts" ("client_id", "priority");
