/*
  Warnings:

  - You are about to drop the column `rol_id` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the `rol` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TipoRol" AS ENUM ('ADMINISTRADOR', 'DOCENTE', 'ALUMNO');

-- DropForeignKey
ALTER TABLE "usuario" DROP CONSTRAINT IF EXISTS "usuario_rol_id_fkey";

-- DropIndex
DROP INDEX IF EXISTS "usuario_rol_id_idx";

-- AlterTable: Agregar columna rol temporalmente permitiendo nulls o default
ALTER TABLE "usuario" ADD COLUMN "rol" "TipoRol" NOT NULL DEFAULT 'ALUMNO';

-- Migrar datos existentes en base a la tabla rol previa
UPDATE "usuario" u
SET "rol" = 'ADMINISTRADOR'
FROM "rol" r
WHERE u."rol_id" = r."rol_id" AND (r."nombre_rol" ILIKE '%admin%' OR u."rol_id" = 3);

UPDATE "usuario" u
SET "rol" = 'DOCENTE'
FROM "rol" r
WHERE u."rol_id" = r."rol_id" AND (r."nombre_rol" ILIKE '%docente%' OR u."rol_id" = 2);

UPDATE "usuario" u
SET "rol" = 'ALUMNO'
FROM "rol" r
WHERE u."rol_id" = r."rol_id" AND (r."nombre_rol" ILIKE '%alumno%' OR u."rol_id" = 1);

-- Eliminar columna rol_id vieja y tabla rol
ALTER TABLE "usuario" DROP COLUMN "rol_id";
DROP TABLE IF EXISTS "rol";

-- CreateIndex
CREATE INDEX "usuario_rol_idx" ON "usuario"("rol");
