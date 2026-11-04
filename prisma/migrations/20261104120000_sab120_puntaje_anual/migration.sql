ALTER TABLE "curso"
ADD COLUMN IF NOT EXISTS "puntaje_anual" INTEGER NOT NULL DEFAULT 140;

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
