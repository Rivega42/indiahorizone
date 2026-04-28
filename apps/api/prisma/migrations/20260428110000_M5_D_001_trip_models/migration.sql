-- M5.D.001 — Trip + Itinerary + DayPlan + Booking models (issue #149)

CREATE TYPE "trip_status" AS ENUM ('draft', 'paid', 'in_progress', 'completed', 'cancelled');
CREATE TYPE "booking_type" AS ENUM ('hotel', 'transfer', 'activity', 'guide');
CREATE TYPE "booking_status" AS ENUM ('pending', 'confirmed', 'cancelled', 'failed');

CREATE TABLE "trips" (
  "id"           UUID NOT NULL DEFAULT gen_random_uuid(),
  "client_id"    UUID NOT NULL,
  "status"       "trip_status" NOT NULL DEFAULT 'draft',
  "starts_at"    TIMESTAMP(3) NOT NULL,
  "ends_at"      TIMESTAMP(3) NOT NULL,
  "region"       TEXT NOT NULL,
  "total_amount" BIGINT,
  "currency"     CHAR(3) NOT NULL DEFAULT 'RUB',
  "created_by"   UUID NOT NULL,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_trips_client_status" ON "trips" ("client_id", "status");
CREATE INDEX "idx_trips_starts" ON "trips" ("starts_at");
CREATE INDEX "idx_trips_created_by" ON "trips" ("created_by");

CREATE TABLE "itineraries" (
  "id"           UUID NOT NULL DEFAULT gen_random_uuid(),
  "trip_id"      UUID NOT NULL,
  "version"      INTEGER NOT NULL DEFAULT 1,
  "published_at" TIMESTAMP(3),
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "itineraries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "itineraries_trip_id_fkey" FOREIGN KEY ("trip_id")
    REFERENCES "trips" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "uq_itineraries_trip_version" ON "itineraries" ("trip_id", "version");
CREATE INDEX "idx_itineraries_trip_published" ON "itineraries" ("trip_id", "published_at");

CREATE TABLE "day_plans" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "itinerary_id"  UUID NOT NULL,
  "day_number"    INTEGER NOT NULL,
  "date"          DATE NOT NULL,
  "summary"       TEXT NOT NULL,
  "items"         JSONB NOT NULL,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "day_plans_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "day_plans_itinerary_id_fkey" FOREIGN KEY ("itinerary_id")
    REFERENCES "itineraries" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "uq_day_plans_itinerary_day" ON "day_plans" ("itinerary_id", "day_number");
CREATE INDEX "idx_day_plans_itinerary_date" ON "day_plans" ("itinerary_id", "date");

CREATE TABLE "bookings" (
  "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
  "trip_id"    UUID NOT NULL,
  "type"       "booking_type" NOT NULL,
  "vendor_id"  TEXT NOT NULL,
  "status"     "booking_status" NOT NULL DEFAULT 'pending',
  "payload"    JSONB NOT NULL,
  "amount"     BIGINT,
  "currency"   CHAR(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "bookings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bookings_trip_id_fkey" FOREIGN KEY ("trip_id")
    REFERENCES "trips" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "idx_bookings_trip_type" ON "bookings" ("trip_id", "type");
CREATE INDEX "idx_bookings_status_created" ON "bookings" ("status", "created_at");
