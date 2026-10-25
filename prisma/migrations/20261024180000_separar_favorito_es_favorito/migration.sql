-- Separa el "favorito" (corazón) del estado de lectura (SAB-087).
-- es_favorito es true solo cuando el alumno marca el corazón; el estado de lectura
-- (estado_lectura) pasa a ser independiente y puede existir sin ser favorito.

ALTER TABLE "favorito"
ADD COLUMN IF NOT EXISTS "es_favorito" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: las filas que ya existían se crearon al marcar el corazón
-- (en el front el estado de lectura solo se podía tocar sobre un favorito),
-- así que se conservan como favoritas. Las nuevas quedan en false por el default.
-- Tras el ADD COLUMN todas las filas quedan en false, por lo que este UPDATE
-- alcanza exactamente a las filas preexistentes.
UPDATE "favorito" SET "es_favorito" = true WHERE "es_favorito" = false;