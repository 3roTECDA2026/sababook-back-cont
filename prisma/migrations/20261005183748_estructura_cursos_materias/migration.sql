-- CreateTable
CREATE TABLE "meta_lectura" (
    "meta_id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "periodo_nombre" VARCHAR(100) NOT NULL,
    "cantidad_libros" INTEGER NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meta_lectura_pkey" PRIMARY KEY ("meta_id")
);

-- CreateTable
CREATE TABLE "configuracion_sistema" (
    "clave" VARCHAR(100) NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" TEXT,
    "actualizado" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configuracion_sistema_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "incidencia_moderacion" (
    "incidencia_id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "contexto" VARCHAR(50) NOT NULL,
    "contenido_bloqueado" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "categoria" VARCHAR(100),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "revisado_por" INTEGER,
    "fecha_revision" TIMESTAMPTZ(6),
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidencia_moderacion_pkey" PRIMARY KEY ("incidencia_id")
);

-- CreateTable
CREATE TABLE "materia" (
    "materia_id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,

    CONSTRAINT "materia_pkey" PRIMARY KEY ("materia_id")
);

-- CreateTable
CREATE TABLE "curso" (
    "curso_id" SERIAL NOT NULL,
    "anio" INTEGER NOT NULL,
    "division" VARCHAR(5) NOT NULL,
    "anio_lectivo" INTEGER NOT NULL,
    "materia_id" INTEGER NOT NULL,

    CONSTRAINT "curso_pkey" PRIMARY KEY ("curso_id")
);

-- CreateTable
CREATE TABLE "curso_docente" (
    "curso_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,

    CONSTRAINT "curso_docente_pkey" PRIMARY KEY ("curso_id","usuario_id")
);

-- CreateTable
CREATE TABLE "curso_libro" (
    "curso_id" INTEGER NOT NULL,
    "libro_id" INTEGER NOT NULL,
    "puntaje" INTEGER NOT NULL,

    CONSTRAINT "curso_libro_pkey" PRIMARY KEY ("curso_id","libro_id")
);

-- CreateTable
CREATE TABLE "inscripcion" (
    "inscripcion_id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "curso_id" INTEGER NOT NULL,
    "anio_lectivo" INTEGER NOT NULL,
    "fecha_inscripcion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inscripcion_pkey" PRIMARY KEY ("inscripcion_id")
);

-- CreateIndex
CREATE INDEX "meta_lectura_usuario_id_idx" ON "meta_lectura"("usuario_id");

-- CreateIndex
CREATE INDEX "incidencia_moderacion_usuario_id_idx" ON "incidencia_moderacion"("usuario_id");

-- CreateIndex
CREATE INDEX "incidencia_moderacion_fecha_idx" ON "incidencia_moderacion"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "materia_nombre_key" ON "materia"("nombre");

-- CreateIndex
CREATE INDEX "curso_materia_id_idx" ON "curso"("materia_id");

-- CreateIndex
CREATE UNIQUE INDEX "curso_anio_division_anio_lectivo_key" ON "curso"("anio", "division", "anio_lectivo");

-- CreateIndex
CREATE INDEX "curso_docente_usuario_id_idx" ON "curso_docente"("usuario_id");

-- CreateIndex
CREATE INDEX "curso_libro_libro_id_idx" ON "curso_libro"("libro_id");

-- CreateIndex
CREATE INDEX "inscripcion_curso_id_idx" ON "inscripcion"("curso_id");

-- CreateIndex
CREATE INDEX "inscripcion_usuario_id_idx" ON "inscripcion"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "inscripcion_usuario_id_anio_lectivo_key" ON "inscripcion"("usuario_id", "anio_lectivo");

-- AddForeignKey
ALTER TABLE "meta_lectura" ADD CONSTRAINT "meta_lectura_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "incidencia_moderacion" ADD CONSTRAINT "incidencia_moderacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "curso" ADD CONSTRAINT "curso_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materia"("materia_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "curso_docente" ADD CONSTRAINT "curso_docente_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso"("curso_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "curso_docente" ADD CONSTRAINT "curso_docente_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "curso_libro" ADD CONSTRAINT "curso_libro_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso"("curso_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "curso_libro" ADD CONSTRAINT "curso_libro_libro_id_fkey" FOREIGN KEY ("libro_id") REFERENCES "libro"("libro_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inscripcion" ADD CONSTRAINT "inscripcion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inscripcion" ADD CONSTRAINT "inscripcion_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso"("curso_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
