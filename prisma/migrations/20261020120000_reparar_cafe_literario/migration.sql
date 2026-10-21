-- Repara 20260930193000_agregar_cafe_literario.
-- En Supabase esa migración falló en su primera línea (columna favorito.estado_lectura
-- duplicada, error 42701) y luego se marcó como aplicada con `prisma migrate resolve`
-- sin ejecutarse. Por eso faltaban foro.cafe_id y las tablas del café.
-- Todo es idempotente: en bases donde la migración original sí se aplicó, no hace nada.

-- AlterTable
ALTER TABLE "foro" ADD COLUMN IF NOT EXISTS "cafe_id" INTEGER;

-- CreateTable
CREATE TABLE IF NOT EXISTS "cafe_literario" (
    "cafe_id" SERIAL NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "libro_id" INTEGER,
    "docente_id" INTEGER,
    "fecha_evento" TIMESTAMPTZ(6) NOT NULL,
    "lugar" VARCHAR(255) DEFAULT 'Biblioteca Ernesto Sábato',
    "estado" VARCHAR(50) DEFAULT 'programado',
    "fecha_creacion" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cafe_literario_pkey" PRIMARY KEY ("cafe_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "asistencia_cafe" (
    "asistencia_id" SERIAL NOT NULL,
    "cafe_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "estado" VARCHAR(50) DEFAULT 'confirmado',
    "fecha_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asistencia_cafe_pkey" PRIMARY KEY ("asistencia_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "voto_cafe" (
    "voto_id" SERIAL NOT NULL,
    "cafe_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "voto" BOOLEAN NOT NULL,
    "fecha_voto" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voto_cafe_pkey" PRIMARY KEY ("voto_id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cafe_literario_libro_id_idx" ON "cafe_literario"("libro_id");
CREATE INDEX IF NOT EXISTS "cafe_literario_docente_id_idx" ON "cafe_literario"("docente_id");
CREATE INDEX IF NOT EXISTS "asistencia_cafe_usuario_id_idx" ON "asistencia_cafe"("usuario_id");
CREATE UNIQUE INDEX IF NOT EXISTS "asistencia_cafe_cafe_id_usuario_id_key" ON "asistencia_cafe"("cafe_id", "usuario_id");
CREATE INDEX IF NOT EXISTS "voto_cafe_usuario_id_idx" ON "voto_cafe"("usuario_id");
CREATE UNIQUE INDEX IF NOT EXISTS "voto_cafe_cafe_id_usuario_id_key" ON "voto_cafe"("cafe_id", "usuario_id");

-- AddForeignKey (solo si todavía no existen)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'foro_cafe_id_fkey' AND conrelid = '"foro"'::regclass) THEN
        ALTER TABLE "foro" ADD CONSTRAINT "foro_cafe_id_fkey" FOREIGN KEY ("cafe_id") REFERENCES "cafe_literario"("cafe_id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cafe_literario_libro_id_fkey' AND conrelid = '"cafe_literario"'::regclass) THEN
        ALTER TABLE "cafe_literario" ADD CONSTRAINT "cafe_literario_libro_id_fkey" FOREIGN KEY ("libro_id") REFERENCES "libro"("libro_id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cafe_literario_docente_id_fkey' AND conrelid = '"cafe_literario"'::regclass) THEN
        ALTER TABLE "cafe_literario" ADD CONSTRAINT "cafe_literario_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "usuario"("usuario_id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'asistencia_cafe_cafe_id_fkey' AND conrelid = '"asistencia_cafe"'::regclass) THEN
        ALTER TABLE "asistencia_cafe" ADD CONSTRAINT "asistencia_cafe_cafe_id_fkey" FOREIGN KEY ("cafe_id") REFERENCES "cafe_literario"("cafe_id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'asistencia_cafe_usuario_id_fkey' AND conrelid = '"asistencia_cafe"'::regclass) THEN
        ALTER TABLE "asistencia_cafe" ADD CONSTRAINT "asistencia_cafe_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'voto_cafe_cafe_id_fkey' AND conrelid = '"voto_cafe"'::regclass) THEN
        ALTER TABLE "voto_cafe" ADD CONSTRAINT "voto_cafe_cafe_id_fkey" FOREIGN KEY ("cafe_id") REFERENCES "cafe_literario"("cafe_id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'voto_cafe_usuario_id_fkey' AND conrelid = '"voto_cafe"'::regclass) THEN
        ALTER TABLE "voto_cafe" ADD CONSTRAINT "voto_cafe_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END $$;
