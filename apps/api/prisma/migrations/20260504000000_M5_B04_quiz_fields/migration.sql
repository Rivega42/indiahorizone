-- B-04 Client quiz/анкета (#421, sub-issue #513).
--
-- Расширяем `client_profiles` структурированными полями quiz'а — для
-- быстрых CRM-фильтров (вегетарианцы, с детьми, новички в Индии) и подбора
-- маршрутов. Отдельные колонки, а не JSON, чтобы:
--   - Менеджер мог фильтровать через WHERE/индексы
--   - Аналитика могла считать срезы
--   - TypeScript-типы были строгие через Prisma client
--
-- Все поля nullable — клиент может ответить только на часть quiz'а.
-- `quizCompletedAt` ставится только при финальном POST /clients/me/quiz —
-- это триггер для downstream listeners (manager-handoff).
--
-- `allergies` — текст, потенциально содержит медданные → шифровать на уровне
-- application через CryptoService (#139). Колонка просто TEXT.
--
-- Безопасность миграции: ADD COLUMN nullable / DEFAULT — non-blocking, не
-- требует rewrite таблицы, не блокирует DML.

-- 1. Enum PaceLevel — темп поездки
CREATE TYPE "pace_level" AS ENUM ('slow', 'medium', 'fast');

-- 2. Enum IndiaExperience — опыт клиента с Индией
CREATE TYPE "india_experience" AS ENUM ('never', 'been_once', 'multiple');

-- 3. Колонки в client_profiles
ALTER TABLE "client_profiles"
  ADD COLUMN "diet_preferences" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "allergies" TEXT,
  ADD COLUMN "pace_level" "pace_level",
  ADD COLUMN "has_children" BOOLEAN,
  ADD COLUMN "children_ages" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  ADD COLUMN "india_experience" "india_experience",
  ADD COLUMN "quiz_completed_at" TIMESTAMP(3);

-- 4. Индекс на quiz_completed_at — менеджеры фильтруют список «новые анкеты»
CREATE INDEX "client_profiles_quiz_completed_at_idx"
  ON "client_profiles" ("quiz_completed_at" DESC NULLS LAST)
  WHERE "quiz_completed_at" IS NOT NULL;

-- 5. Индекс на india_experience — для quick-filter «новички» (LeadProfile сегмент)
CREATE INDEX "client_profiles_india_experience_idx"
  ON "client_profiles" ("india_experience")
  WHERE "india_experience" IS NOT NULL;
