-- Crear tabla de recomendaciones de libros
CREATE TABLE "recomendacion_libro" (
    "recomendacion_id" SERIAL NOT NULL,
    "libro_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "explicacion" TEXT,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recomendacion_libro_pkey"
        PRIMARY KEY ("recomendacion_id")
);

-- Índice para consultar recomendaciones por libro
CREATE INDEX "recomendacion_libro_libro_id_idx"
ON "recomendacion_libro"("libro_id");

-- Evitar que un usuario recomiende dos veces el mismo libro
CREATE UNIQUE INDEX "recomendacion_libro_libro_id_usuario_id_key"
ON "recomendacion_libro"("libro_id", "usuario_id");

-- Relación con libros
ALTER TABLE "recomendacion_libro"
ADD CONSTRAINT "recomendacion_libro_libro_id_fkey"
FOREIGN KEY ("libro_id")
REFERENCES "libro"("libro_id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Relación con usuarios
ALTER TABLE "recomendacion_libro"
ADD CONSTRAINT "recomendacion_libro_usuario_id_fkey"
FOREIGN KEY ("usuario_id")
REFERENCES "usuario"("usuario_id")
ON DELETE CASCADE
ON UPDATE CASCADE;
