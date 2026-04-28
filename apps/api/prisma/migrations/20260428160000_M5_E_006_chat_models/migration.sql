-- M5.E.006 — Chat models (issue #167)
--
-- ChatThread + ChatMessage. Schema-only (#167). REST endpoints — #169.
-- WebSocket gateway — #168.
--
-- Cross-module rules:
-- - subject_id, from_user_id, participants[] — soft-refs (нет FK)
-- - thread_id (ChatMessage → ChatThread) — FK OK (один модуль)

CREATE TYPE "chat_thread_kind" AS ENUM ('trip', 'sos', 'sales');
CREATE TYPE "chat_thread_status" AS ENUM ('open', 'closed', 'archived');

CREATE TABLE "chat_threads" (
  "id"           UUID NOT NULL DEFAULT gen_random_uuid(),
  "kind"         "chat_thread_kind" NOT NULL,
  "subject_id"   UUID NOT NULL,
  "participants" UUID[] NOT NULL DEFAULT '{}',
  "status"       "chat_thread_status" NOT NULL DEFAULT 'open',
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "chat_threads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_chat_threads_kind_subject" ON "chat_threads" ("kind", "subject_id");
CREATE INDEX "idx_chat_threads_status_updated" ON "chat_threads" ("status", "updated_at" DESC);

CREATE TABLE "chat_messages" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "thread_id"     UUID NOT NULL,
  "from_user_id"  UUID NOT NULL,
  "body"          TEXT NOT NULL,
  "attachments"   UUID[] NOT NULL DEFAULT '{}',
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "read_by"       JSONB NOT NULL DEFAULT '{}',

  CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chat_messages_thread_id_fkey" FOREIGN KEY ("thread_id")
    REFERENCES "chat_threads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "idx_chat_messages_thread_created" ON "chat_messages" ("thread_id", "created_at" DESC);
CREATE INDEX "idx_chat_messages_from_user_created" ON "chat_messages" ("from_user_id", "created_at" DESC);
