-- CreateEnum
CREATE TYPE "AccionAsignacion" AS ENUM ('ASIGNADO', 'PUNTAJE_ACTUALIZADO', 'QUITADO');

-- CreateTable
CREATE TABLE "historial_asignacion" (
    "historial_id" SERIAL NOT NULL,
    "curso_id" INTEGER NOT NULL,
    "libro_id" INTEGER NOT NULL,
    "usuario_id" INTEGER,
    "anio_lectivo" INTEGER NOT NULL,
    "accion" "AccionAsignacion" NOT NULL,
    "puntaje" INTEGER,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_asignacion_pkey" PRIMARY KEY ("historial_id")
);

-- CreateIndex
CREATE INDEX "historial_asignacion_anio_lectivo_idx" ON "historial_asignacion"("anio_lectivo");
CREATE INDEX "historial_asignacion_curso_id_idx" ON "historial_asignacion"("curso_id");
CREATE INDEX "historial_asignacion_libro_id_idx" ON "historial_asignacion"("libro_id");
CREATE INDEX "historial_asignacion_usuario_id_idx" ON "historial_asignacion"("usuario_id");

-- AddForeignKey
ALTER TABLE "historial_asignacion" ADD CONSTRAINT "historial_asignacion_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso"("curso_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "historial_asignacion" ADD CONSTRAINT "historial_asignacion_libro_id_fkey" FOREIGN KEY ("libro_id") REFERENCES "libro"("libro_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "historial_asignacion" ADD CONSTRAINT "historial_asignacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- Carga inicial: las asignaciones que ya existen quedan registradas como ASIGNADO
INSERT INTO "historial_asignacion" ("curso_id", "libro_id", "usuario_id", "anio_lectivo", "accion", "puntaje")
SELECT cl."curso_id", cl."libro_id", NULL, c."anio_lectivo", 'ASIGNADO', cl."puntaje"
FROM "curso_libro" cl
JOIN "curso" c ON c."curso_id" = cl."curso_id";