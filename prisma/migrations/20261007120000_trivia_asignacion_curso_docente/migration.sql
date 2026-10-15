-- AlterTable
ALTER TABLE "trivia_evaluacion" ADD COLUMN "curso_id" INTEGER,
ADD COLUMN "docente_id" INTEGER;

-- AlterTable
ALTER TABLE "trivia_pregunta" ADD COLUMN "curso_id" INTEGER,
ADD COLUMN "docente_id" INTEGER;

-- CreateIndex
CREATE INDEX "trivia_pregunta_curso_id_idx" ON "trivia_pregunta"("curso_id");

-- CreateIndex
CREATE INDEX "trivia_pregunta_docente_id_idx" ON "trivia_pregunta"("docente_id");

-- CreateIndex
CREATE INDEX "trivia_evaluacion_curso_id_idx" ON "trivia_evaluacion"("curso_id");

-- CreateIndex
CREATE INDEX "trivia_evaluacion_docente_id_idx" ON "trivia_evaluacion"("docente_id");

-- AddForeignKey
ALTER TABLE "trivia_pregunta" ADD CONSTRAINT "trivia_pregunta_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso"("curso_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trivia_pregunta" ADD CONSTRAINT "trivia_pregunta_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trivia_evaluacion" ADD CONSTRAINT "trivia_evaluacion_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso"("curso_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trivia_evaluacion" ADD CONSTRAINT "trivia_evaluacion_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;