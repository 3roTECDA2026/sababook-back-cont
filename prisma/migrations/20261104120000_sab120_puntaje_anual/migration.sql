ALTER TABLE "curso"
ADD COLUMN IF NOT EXISTS "puntaje_anual" INTEGER NOT NULL DEFAULT 140;

-- Cursos existentes toman el mínimo anual configurado, si existe; si no, quedan en 140.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "configuracion_sistema"
    WHERE clave = 'puntaje_minimo_anual'
  ) THEN
    UPDATE "curso"
    SET "puntaje_anual" = LEAST(GREATEST(valor::INTEGER, 140), 200)
    FROM "configuracion_sistema"
    WHERE "configuracion_sistema".clave = 'puntaje_minimo_anual';
  END IF;
END $$;

ALTER TABLE "curso_libro"
ALTER COLUMN "puntaje" DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'curso_puntaje_anual_check'
      AND conrelid = '"curso"'::regclass
  ) THEN
    ALTER TABLE "curso"
    ADD CONSTRAINT "curso_puntaje_anual_check"
    CHECK ("puntaje_anual" BETWEEN 140 AND 200);
  END IF;
END $$;
