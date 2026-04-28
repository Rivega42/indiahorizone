-- Align schema ↔ migrations drift (chore).
--
-- Контекст: ранее migrations были handwritten + некоторые auto-gen Prisma'ой.
-- Они расходились в трактовке id-DEFAULT:
-- - 0_init и часть migrations: id UUID NOT NULL — без DEFAULT (Prisma client
--   передаёт uuid() из crypto.randomUUID() в INSERT)
-- - M5_* manual migrations: id UUID NOT NULL DEFAULT gen_random_uuid()
--
-- В реальной БД на dev/staging таблицы имеют DEFAULT (применённые M5_* migrations).
-- В schema.prisma — теперь все @default(dbgenerated("gen_random_uuid()")) для
-- консистентности.
--
-- Эта миграция добавляет DEFAULT к тем таблицам, где его не было — чтобы
-- база была единообразной и `prisma migrate diff` показывал zero drift.
--
-- Безопасно: ALTER TABLE ... SET DEFAULT не блокирует чтение/запись и не
-- меняет существующие данные. INSERT'ы с явным id продолжают работать.

ALTER TABLE "client_profiles" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "clients" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "leads" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "outbox_entries" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "push_subscriptions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "tour_days" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "tour_media" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "tours" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
