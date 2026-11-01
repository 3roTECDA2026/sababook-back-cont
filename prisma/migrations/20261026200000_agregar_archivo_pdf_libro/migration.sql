-- Migración para soporte de carga de archivos PDF como material de lectura (SAB-67)
ALTER TABLE "libro" ADD COLUMN IF NOT EXISTS "archivo_url" TEXT;
