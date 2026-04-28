-- M5.K.001 — AuditEvent append-only audit log (issue #218)
--
-- Принципы:
-- 1. event_id UNIQUE — idempotency (event может прийти дважды через at-least-once
--    Redis Streams; UNIQUE гарантирует одну запись).
-- 2. Append-only через trigger: UPDATE и DELETE поднимают exception.
--    Заблокирован даже superuser-ORM-доступ (Prisma не может обойти trigger).
-- 3. Index'ы по type+occurred_at и occurred_at — типичные запросы admin-панели:
--    «все события user X», «все auth.* за неделю», «всё по trip Y».
--
-- См. docs/ARCH/SECURITY/AUDIT_LOG.md.

CREATE TABLE "audit_events" (
  "event_id"        UUID NOT NULL,
  "type"            TEXT NOT NULL,
  "actor"           JSONB NOT NULL,
  "payload"         JSONB NOT NULL,
  "occurred_at"     TIMESTAMP(3) NOT NULL,
  "recorded_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "schema_version"  INTEGER NOT NULL DEFAULT 1,
  "correlation_id"  TEXT,
  "causation_id"    TEXT,

  CONSTRAINT "audit_events_pkey" PRIMARY KEY ("event_id")
);

CREATE INDEX "idx_audit_events_type_occurred" ON "audit_events" ("type", "occurred_at" DESC);
CREATE INDEX "idx_audit_events_occurred" ON "audit_events" ("occurred_at" DESC);

-- ────────────────────────── Append-only enforcement ──────────────────────────
-- Защита от accidental или malicious UPDATE/DELETE через ORM или прямой SQL.
-- При попытке — exception с понятным сообщением.
--
-- NOTE: TRUNCATE и DROP TABLE — не блокируются триггерами (нет before-truncate
-- trigger в нативе). Защита от них — на уровне prod-DB grants (в фазе 4 audit-svc
-- в отдельной БД с readonly-grant'ом для всех остальных сервисов).

CREATE OR REPLACE FUNCTION audit_events_block_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only — UPDATE/DELETE not allowed (op=%, event_id=%)',
    TG_OP, COALESCE(OLD.event_id::text, 'unknown');
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_events_no_update
  BEFORE UPDATE ON "audit_events"
  FOR EACH ROW
  EXECUTE FUNCTION audit_events_block_modification();

CREATE TRIGGER audit_events_no_delete
  BEFORE DELETE ON "audit_events"
  FOR EACH ROW
  EXECUTE FUNCTION audit_events_block_modification();
