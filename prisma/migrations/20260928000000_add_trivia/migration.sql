-- CreateTable
CREATE TABLE "trivia_pregunta" (
    "pregunta_id" SERIAL NOT NULL,
    "libro_id" INTEGER NOT NULL,
    "evaluacion_id" INTEGER,
    "modo" VARCHAR(20) NOT NULL DEFAULT 'trivia',
    "formato" VARCHAR(20) NOT NULL DEFAULT 'multiple',
    "consigna" TEXT NOT NULL,
    "fecha_limite" DATE,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trivia_pregunta_pkey" PRIMARY KEY ("pregunta_id")
);

-- CreateTable
CREATE TABLE "trivia_evaluacion" (
    "evaluacion_id" SERIAL NOT NULL,
    "libro_id" INTEGER NOT NULL,
    "fecha_limite" DATE,
    "descripcion" TEXT,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trivia_evaluacion_pkey" PRIMARY KEY ("evaluacion_id")
);

-- CreateTable
CREATE TABLE "trivia_intento" (
    "attemptId" SERIAL NOT NULL,
    "evaluacion_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "aciertos" INTEGER NOT NULL,
    "total_preguntas" INTEGER NOT NULL,
    "puntaje" INTEGER NOT NULL,
    "respuestas_json" JSON NOT NULL,
    "fecha_entrega" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trivia_intento_pkey" PRIMARY KEY ("attemptId")
);

-- CreateTable
CREATE TABLE "trivia_opcion" (
    "opcion_id" SERIAL NOT NULL,
    "pregunta_id" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "es_correcta" BOOLEAN,

    CONSTRAINT "trivia_opcion_pkey" PRIMARY KEY ("opcion_id")
);

-- CreateTable
CREATE TABLE "trivia_par" (
    "par_id" SERIAL NOT NULL,
    "pregunta_id" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL,
    "izquierda" TEXT NOT NULL,
    "derecha" TEXT NOT NULL,

    CONSTRAINT "trivia_par_pkey" PRIMARY KEY ("par_id")
);

-- CreateTable
CREATE TABLE "trivia_respuesta" (
    "respuesta_id" SERIAL NOT NULL,
    "pregunta_id" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,

    CONSTRAINT "trivia_respuesta_pkey" PRIMARY KEY ("respuesta_id")
);

-- CreateIndex
CREATE INDEX "trivia_pregunta_libro_id_idx" ON "trivia_pregunta"("libro_id");

-- CreateIndex
CREATE INDEX "trivia_pregunta_modo_idx" ON "trivia_pregunta"("modo");

-- CreateIndex
CREATE INDEX "trivia_pregunta_evaluacion_id_idx" ON "trivia_pregunta"("evaluacion_id");

-- CreateIndex
CREATE INDEX "trivia_evaluacion_libro_id_idx" ON "trivia_evaluacion"("libro_id");

-- CreateIndex
CREATE INDEX "trivia_intento_evaluacion_id_idx" ON "trivia_intento"("evaluacion_id");

-- CreateIndex
CREATE INDEX "trivia_intento_usuario_id_idx" ON "trivia_intento"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "trivia_intento_evaluacion_id_usuario_id_key" ON "trivia_intento"("evaluacion_id", "usuario_id");

-- CreateIndex
CREATE INDEX "trivia_opcion_pregunta_id_idx" ON "trivia_opcion"("pregunta_id");

-- CreateIndex
CREATE INDEX "trivia_par_pregunta_id_idx" ON "trivia_par"("pregunta_id");

-- CreateIndex
CREATE INDEX "trivia_respuesta_pregunta_id_idx" ON "trivia_respuesta"("pregunta_id");

-- AddForeignKey
ALTER TABLE "trivia_pregunta" ADD CONSTRAINT "trivia_pregunta_libro_id_fkey" FOREIGN KEY ("libro_id") REFERENCES "libro"("libro_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trivia_pregunta" ADD CONSTRAINT "trivia_pregunta_evaluacion_id_fkey" FOREIGN KEY ("evaluacion_id") REFERENCES "trivia_evaluacion"("evaluacion_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trivia_evaluacion" ADD CONSTRAINT "trivia_evaluacion_libro_id_fkey" FOREIGN KEY ("libro_id") REFERENCES "libro"("libro_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trivia_intento" ADD CONSTRAINT "trivia_intento_evaluacion_id_fkey" FOREIGN KEY ("evaluacion_id") REFERENCES "trivia_evaluacion"("evaluacion_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trivia_intento" ADD CONSTRAINT "trivia_intento_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trivia_opcion" ADD CONSTRAINT "trivia_opcion_pregunta_id_fkey" FOREIGN KEY ("pregunta_id") REFERENCES "trivia_pregunta"("pregunta_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trivia_par" ADD CONSTRAINT "trivia_par_pregunta_id_fkey" FOREIGN KEY ("pregunta_id") REFERENCES "trivia_pregunta"("pregunta_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trivia_respuesta" ADD CONSTRAINT "trivia_respuesta_pregunta_id_fkey" FOREIGN KEY ("pregunta_id") REFERENCES "trivia_pregunta"("pregunta_id") ON DELETE CASCADE ON UPDATE NO ACTION;

