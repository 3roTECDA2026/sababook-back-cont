-- Agrega el flag de habilitación a las evaluaciones de trivia.
-- Las evaluaciones nuevas arrancan deshabilitadas: el docente las habilita
-- explícitamente cuando ya cargó las preguntas.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'trivia_evaluacion'
          AND column_name = 'habilitada'
    ) THEN
        ALTER TABLE "trivia_evaluacion"
        ADD COLUMN "habilitada" BOOLEAN NOT NULL DEFAULT false;

        -- Las evaluaciones que ya existían quedaban visibles para los alumnos,
        -- así que se mantienen habilitadas para no romper los intentos en curso.
        UPDATE "trivia_evaluacion" SET "habilitada" = true;
    END IF;
END $$;
