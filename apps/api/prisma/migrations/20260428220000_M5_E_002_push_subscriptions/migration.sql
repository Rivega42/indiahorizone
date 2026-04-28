-- M5.E.002 — PushSubscription model для Web Push + future native (#163)
--
-- Хранит W3C Web Push subscription'ы (endpoint + keys для VAPID-encryption)
-- per (user, device). Soft-delete через deleted_at. ENUM platform для
-- расширения на ios_native (APNs) / android_native (FCM) в фазе 4.

CREATE TYPE "push_platform" AS ENUM ('web', 'ios_native', 'android_native');

CREATE TABLE "push_subscriptions" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id"       UUID NOT NULL,
  "platform"      "push_platform" NOT NULL DEFAULT 'web',
  "endpoint"      VARCHAR(2048) NOT NULL,
  "p256dh"        VARCHAR(255),
  "auth"          VARCHAR(255),
  "device_label"  VARCHAR(120),
  "last_seen_at"  TIMESTAMP(3),
  "deleted_at"    TIMESTAMP(3),
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "push_subscriptions_user_fk" FOREIGN KEY ("user_id")
    REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "uq_push_subs_user_endpoint" ON "push_subscriptions" ("user_id", "endpoint");
CREATE INDEX "idx_push_subs_user" ON "push_subscriptions" ("user_id");
CREATE INDEX "idx_push_subs_deleted" ON "push_subscriptions" ("deleted_at");
