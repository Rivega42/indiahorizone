-- Migration: M5.12.4 — leads domain (Lead model)
-- Issue: #297 [12.4]
-- Эпик: #293
--
-- Заявки с tour landing pages (форма «Хочу этот тур»).
-- ПДн поля (name, contact, comment) — encrypted через CryptoService (#139),
-- хранятся как base64 TEXT.
--
-- ipHash — sha256(ip) для антифрод-аналитики; raw IP не храним (privacy).
-- Cross-module rule: НЕТ FK на User/Tour — Lead независим.

-- CreateEnum
CREATE TYPE "lead_status" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'REJECTED');

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_type" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "comment" TEXT,
    "consent_text_version" TEXT NOT NULL,
    "ip_hash" TEXT,
    "user_agent" TEXT,
    "status" "lead_status" NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_leads_status_created" ON "leads"("status", "created_at");

-- CreateIndex
CREATE INDEX "idx_leads_source" ON "leads"("source");
