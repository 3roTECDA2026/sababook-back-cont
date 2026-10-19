-- Agregar el autor de una lista o recomendación.
-- La columna es opcional para conservar los registros existentes.

ALTER TABLE "public"."lista"
ADD COLUMN IF NOT EXISTS "creador_id" INTEGER;

-- Relacionar el creador con un usuario existente.
ALTER TABLE "public"."lista"
ADD CONSTRAINT "lista_creador_id_fkey"
FOREIGN KEY ("creador_id")
REFERENCES "public"."usuario"("usuario_id")
ON DELETE SET NULL
ON UPDATE NO ACTION;

-- Facilitar las consultas por creador.
CREATE INDEX IF NOT EXISTS "lista_creador_id_idx"
ON "public"."lista"("creador_id");
