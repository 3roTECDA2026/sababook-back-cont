-- fecha_estado: cuándo cambió el estado de lectura por última vez.
-- Los registros existentes quedan con la fecha de esta migración.
ALTER TABLE "favorito"
ADD COLUMN IF NOT EXISTS "fecha_estado" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
