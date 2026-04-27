-- Migration: M5.C.001 — Client + ClientProfile models
-- Issue: #138
-- Depends on: #126 (users table)
--
-- Cross-module rule: userId на таблицу users — soft-reference (без FK).
-- Это позволяет в фазе 4–5 вынести clients в отдельный сервис/БД.

-- CreateTable: clients
CREATE TABLE "clients" (
    "id" UUID NOT NULL,
    -- Soft-reference на users.id (без FK — cross-module policy)
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable: client_profiles
CREATE TABLE "client_profiles" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    -- ПДн-поля (#139 добавит шифрование)
    "first_name" TEXT,
    "last_name" TEXT,
    "date_of_birth" DATE,
    -- ISO 3166-1 alpha-2
    "citizenship" CHAR(2),
    "phone" TEXT,
    "telegram_handle" TEXT,
    -- Свободный JSONB: языки, диеты, предпочтения
    "preferences" JSONB DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: userId уникален (один User → один Client)
CREATE UNIQUE INDEX "clients_user_id_key" ON "clients"("user_id");

-- CreateIndex: поиск по userId
CREATE INDEX "idx_clients_user_id" ON "clients"("user_id");

-- CreateIndex: clientId уникален в profiles (1-to-1)
CREATE UNIQUE INDEX "client_profiles_client_id_key" ON "client_profiles"("client_id");

-- AddForeignKey: client_profiles → clients (внутри модуля — FK разрешён)
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_client_id_fkey"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
