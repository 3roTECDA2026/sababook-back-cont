-- SAB-144: el docente decide si los alumnos del curso ven su puntaje anual en Inicio.
-- Por defecto queda oculto: nadie ve su puntaje hasta que el docente lo habilite.
ALTER TABLE "curso"
ADD COLUMN IF NOT EXISTS "show_annual_score" BOOLEAN NOT NULL DEFAULT false;
