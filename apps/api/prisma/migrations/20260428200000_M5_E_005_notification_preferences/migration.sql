-- M5.E.005 — Notification preferences (issue #166)
--
-- One row per (user, category). channels is array of enabled NotificationChannel.
-- SOS protected — service-side enforcement (нет DB-constraint, потому что
-- preferences для SOS могут отсутствовать — defaults applied в service).

CREATE TYPE "notification_category" AS ENUM ('trips', 'marketing', 'sos', 'system');

CREATE TABLE "notification_preferences" (
  "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    UUID NOT NULL,
  "category"   "notification_category" NOT NULL,
  "channels"   "notification_channel"[] NOT NULL DEFAULT '{}',
  "enabled"    BOOLEAN NOT NULL DEFAULT true,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_notification_preferences_user_category" ON "notification_preferences" ("user_id", "category");
