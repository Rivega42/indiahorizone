-- M5.F.001 — MediaAsset model + S3 storage bookkeeping (issue #173)
--
-- bucket private, SSE-S3 enforced на bucket level (Vика настраивает в R2/MinIO).
-- Schema-bookkeeping: id, owner, kind, mime, size, s3_key, status, caption.

CREATE TYPE "media_asset_kind" AS ENUM ('photo', 'video', 'circle', 'document');
CREATE TYPE "media_asset_status" AS ENUM ('pending', 'uploaded', 'transcoded', 'failed');

CREATE TABLE "media_assets" (
  "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
  "owner_id"   UUID NOT NULL,
  "kind"       "media_asset_kind" NOT NULL,
  "mime_type"  TEXT NOT NULL,
  "size"       BIGINT NOT NULL,
  "s3_key"     TEXT NOT NULL,
  "status"     "media_asset_status" NOT NULL DEFAULT 'pending',
  "caption"    TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_media_assets_owner_kind_created" ON "media_assets" ("owner_id", "kind", "created_at" DESC);
CREATE INDEX "idx_media_assets_status_created" ON "media_assets" ("status", "created_at");
