-- Migration: M5 catalog domain — Tour + TourDay + TourMedia
-- Issue: #294 [12.1]
-- Эпик: #293
--
-- Источник: docs/ARCH/CATALOG.md (создаётся в #311), spec в issue body.
--
-- Что добавляем:
-- - tour_status enum (DRAFT, PUBLISHED, ARCHIVED)
-- - tours (главная сущность каталога)
-- - tour_days (1..N дней маршрута, unique по (tour_id, day_number))
-- - tour_media (фото/видео с order для галерей)
--
-- Cross-module rule: НЕТ FK на users / clients. Catalog независим, в фазе 4
-- может быть extracted в catalog-svc с публичным CDN-кешем.
--
-- Hardening:
-- - Cascade delete: удаление тура → удаление всех дней + медиа.
-- - costInr* в tour_days НЕ отдаётся в публичный API (CatalogService DTO
--   mapping исключает; защита от утечки внутренней маржи через bundle).

-- CreateEnum
CREATE TYPE "tour_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "tours" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "tour_status" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "season" TEXT NOT NULL,
    "price_from_rub" INTEGER NOT NULL,
    "price_to_rub" INTEGER,
    "group_size" TEXT NOT NULL,
    "hero_video_url" TEXT,
    "hero_poster_url" TEXT NOT NULL,
    "emotional_hook" TEXT NOT NULL,
    "inclusions" JSONB NOT NULL,
    "faq" JSONB NOT NULL,
    "trust_badges" JSONB NOT NULL,
    "facts" JSONB NOT NULL,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_days" (
    "id" UUID NOT NULL,
    "tour_id" UUID NOT NULL,
    "day_number" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "activities" JSONB NOT NULL,
    "image_url" TEXT NOT NULL,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "cost_inr_from" INTEGER,
    "cost_inr_to" INTEGER,

    CONSTRAINT "tour_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_media" (
    "id" UUID NOT NULL,
    "tour_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tour_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tours_slug_key" ON "tours"("slug");

-- CreateIndex
CREATE INDEX "idx_tours_status_published" ON "tours"("status", "published_at");

-- CreateIndex
CREATE INDEX "idx_tour_days_tour" ON "tour_days"("tour_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_tour_days_tour_day" ON "tour_days"("tour_id", "day_number");

-- CreateIndex
CREATE INDEX "idx_tour_media_tour_kind" ON "tour_media"("tour_id", "kind");

-- AddForeignKey
ALTER TABLE "tour_days" ADD CONSTRAINT "tour_days_tour_id_fkey"
    FOREIGN KEY ("tour_id") REFERENCES "tours"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_media" ADD CONSTRAINT "tour_media_tour_id_fkey"
    FOREIGN KEY ("tour_id") REFERENCES "tours"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
