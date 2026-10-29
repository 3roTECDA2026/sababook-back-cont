-- SAB-91: eliminar el valor predeterminado de 100 páginas.
ALTER TABLE "libro"
ALTER COLUMN "paginas_totales" DROP DEFAULT;

-- No inventar páginas para libros existentes.
-- Si hay registros sin páginas válidas, detener la migración
-- para corregirlos con los datos reales de su edición.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "libro"
    WHERE "paginas_totales" IS NULL
       OR "paginas_totales" <= 0
  ) THEN
    RAISE EXCEPTION
      'SAB-91: existen libros sin una cantidad válida de páginas. Corregir los registros antes de migrar.';
  END IF;
END $$;

-- Exigir que todos los libros tengan páginas.
ALTER TABLE "libro"
ALTER COLUMN "paginas_totales" SET NOT NULL;

-- Impedir valores iguales o menores que cero.
-- Evitar crear la restricción dos veces.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'libro_paginas_totales_positivas'
      AND conrelid = 'libro'::regclass
  ) THEN
    ALTER TABLE "libro"
    ADD CONSTRAINT "libro_paginas_totales_positivas"
    CHECK ("paginas_totales" > 0);
  END IF;
END $$;