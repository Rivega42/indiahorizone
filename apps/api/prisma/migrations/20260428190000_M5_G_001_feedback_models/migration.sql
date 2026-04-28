-- M5.G.001 — FeedbackRequest + Feedback (issue #186)
--
-- Cross-module: trip_id, media_id — soft-refs (без FK).
-- Один feedback на (trip, day_number) — unique constraint.

CREATE TYPE "feedback_type" AS ENUM ('text', 'circle');
CREATE TYPE "feedback_mood" AS ENUM ('bad', 'neutral', 'ok', 'good', 'excellent');

CREATE TABLE "feedback_requests" (
  "id"           UUID NOT NULL DEFAULT gen_random_uuid(),
  "trip_id"      UUID NOT NULL,
  "day_number"   INTEGER NOT NULL,
  "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at"   TIMESTAMP(3) NOT NULL,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "feedback_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_feedback_requests_trip_day" ON "feedback_requests" ("trip_id", "day_number");
CREATE INDEX "idx_feedback_requests_expires" ON "feedback_requests" ("expires_at");

CREATE TABLE "feedback" (
  "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
  "request_id"  UUID,
  "trip_id"     UUID NOT NULL,
  "day_number"  INTEGER NOT NULL,
  "type"        "feedback_type" NOT NULL,
  "body"        TEXT NOT NULL,
  "mood"        "feedback_mood" NOT NULL,
  "media_id"    UUID,
  "signals"     JSONB NOT NULL DEFAULT '{}',
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_feedback_trip_day" ON "feedback" ("trip_id", "day_number");
CREATE INDEX "idx_feedback_trip_created" ON "feedback" ("trip_id", "created_at");
CREATE INDEX "idx_feedback_mood_created" ON "feedback" ("mood", "created_at");
