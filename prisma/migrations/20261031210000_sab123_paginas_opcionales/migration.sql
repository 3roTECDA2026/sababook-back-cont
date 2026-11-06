-- SAB-123: permitir libros sin cantidad de páginas.

-- Eliminar cualquier valor predeterminado.
ALTER TABLE "libro"
ALTER COLUMN "paginas_totales" DROP DEFAULT;

-- Permitir NULL cuando no se informó la cantidad de páginas.
ALTER TABLE "libro"
ALTER COLUMN "paginas_totales" DROP NOT NULL;

-- Se conserva la restricción existente:
-- Si se informa una cantidad, debe ser mayor que cero.
-- PostgreSQL permite NULL en CHECK (paginas_totales > 0).
