-- SAB-117: cada curso tiene un solo docente (un docente puede tener varios cursos).

-- No elegir automáticamente qué docente queda en cada curso.
-- Si hay cursos con más de un docente, detener la migración para resolverlos a mano.
DO $$
DECLARE
  cursos_con_varios TEXT;
BEGIN
  SELECT string_agg("curso_id"::TEXT, ', ' ORDER BY "curso_id")
  INTO cursos_con_varios
  FROM (
    SELECT "curso_id"
    FROM "curso_docente"
    GROUP BY "curso_id"
    HAVING count(*) > 1
  ) AS duplicados;

  IF cursos_con_varios IS NOT NULL THEN
    RAISE EXCEPTION
      'SAB-117: hay cursos con más de un docente (curso_id: %). Dejar uno solo por curso antes de migrar.',
      cursos_con_varios;
  END IF;
END $$;

-- El índice único hace cumplir la regla aunque lleguen dos asignaciones al mismo tiempo.
CREATE UNIQUE INDEX IF NOT EXISTS "curso_docente_curso_id_key"
ON "curso_docente" ("curso_id");
