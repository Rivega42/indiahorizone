-- M5.E.001 — Notification base модель (issue #162)
--
-- Запись об отправке любой нотификации (email/push/sms/telegram).
-- Provider-specific детали (SMTP server, FCM token, etc.) — НЕ в этой таблице,
-- а в env. Notification — bookkeeping что и кому отправили.

CREATE TYPE "notification_channel" AS ENUM ('email', 'push', 'sms', 'telegram');
CREATE TYPE "notification_status" AS ENUM ('pending', 'sent', 'failed');

CREATE TABLE "notifications" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "channel"       "notification_channel" NOT NULL,
  "recipient"     TEXT NOT NULL,
  "template_id"   TEXT NOT NULL,
  "payload"       JSONB NOT NULL,
  "status"        "notification_status" NOT NULL DEFAULT 'pending',
  "sent_at"       TIMESTAMP(3),
  "failed_at"     TIMESTAMP(3),
  "error_message" TEXT,
  "user_id"       UUID,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_notifications_status_created" ON "notifications" ("status", "created_at");
CREATE INDEX "idx_notifications_recipient_created" ON "notifications" ("recipient", "created_at" DESC);
CREATE INDEX "idx_notifications_user_created" ON "notifications" ("user_id", "created_at" DESC);
