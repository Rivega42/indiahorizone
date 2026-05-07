-- B-04 Client quiz/анкета (#421, sub-issue #513). v3.
-- Verified locally: prisma migrate diff --exit-code returns 0 (no drift).
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
-- Prisma 5.22 для `String[] @default([])` генерит `TEXT[] DEFAULT ARRAY[]::TEXT[]`
-- БЕЗ NOT NULL (в отличие от старых миграций). Это поведение совпадает с pg-семантикой
-- массивов: empty array != NULL. Применяем здесь тот же стиль чтобы избежать drift.
ALTER TABLE "client_profiles"
  ADD COLUMN "diet_preferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "allergies" TEXT,
  ADD COLUMN "pace_level" "pace_level",
  ADD COLUMN "has_children" BOOLEAN,
  ADD COLUMN "children_ages" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  ADD COLUMN "india_experience" "india_experience",
  ADD COLUMN "quiz_completed_at" TIMESTAMP(3);

-- Partial индексы для CRM-фильтров (quiz_completed_at DESC, india_experience)
-- НЕ добавляем здесь — они не объявлены в schema.prisma → drift detection
-- падает. Появятся отдельной миграцией, когда будут готовы admin-queries
-- (после EPIC 13). При EXPLAIN'е показано: для текущего объёма (≤1K профилей)
-- sequential scan быстрее partial index'а — миграция бесполезна на старте.
