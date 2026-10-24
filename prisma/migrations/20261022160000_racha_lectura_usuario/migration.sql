-- Migración para soporte de racha de lecturas por usuario (SAB-85)
ALTER TABLE "usuario"
  ADD COLUMN IF NOT EXISTS "racha_actual" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "record_racha" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "ultima_fecha_lectura" TIMESTAMPTZ(6);
