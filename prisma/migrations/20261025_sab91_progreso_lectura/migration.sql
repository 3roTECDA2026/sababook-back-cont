-- SAB-91: Progreso individual de lectura

ALTER TABLE "favorito"
ADD COLUMN IF NOT EXISTS "current_page" INTEGER NOT NULL DEFAULT 0;