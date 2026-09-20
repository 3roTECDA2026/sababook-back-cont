-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TipoActividad" AS ENUM ('NUEVO_LIBRO', 'RADIO_EPISODIO', 'FORO_APL', 'NUEVA_OPINION', 'AVISO');

-- CreateTable
CREATE TABLE "rol" (
    "rol_id" SERIAL NOT NULL,
    "nombre_rol" VARCHAR(50) NOT NULL,

    CONSTRAINT "rol_pkey" PRIMARY KEY ("rol_id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "usuario_id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "contrasena" TEXT NOT NULL,
    "rol_id" INTEGER,
    "fecha_registro" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "perfil_completo" BOOLEAN NOT NULL DEFAULT false,
    "avatar_url" TEXT,
    "nivel_educativo" VARCHAR(50),

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "actividad_feed" (
    "actividad_id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "tipo" "TipoActividad" NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "entidad_id" INTEGER,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "actividad_feed_pkey" PRIMARY KEY ("actividad_id")
);

-- CreateTable
CREATE TABLE "libro" (
    "libro_id" SERIAL NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "autor" VARCHAR(255) NOT NULL,
    "genero" VARCHAR(100),
    "descripcion" TEXT,
    "portada_url" TEXT,
    "nivel_educativo" VARCHAR(50),
    "calificacion_promedio" DOUBLE PRECISION,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "libro_pkey" PRIMARY KEY ("libro_id")
);

-- CreateTable
CREATE TABLE "favorito" (
    "usuario_id" INTEGER NOT NULL,
    "libro_id" INTEGER NOT NULL,

    CONSTRAINT "favorito_pkey" PRIMARY KEY ("usuario_id","libro_id")
);

-- CreateTable
CREATE TABLE "opinion" (
    "opinion_id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "libro_id" INTEGER NOT NULL,
    "calificacion" SMALLINT,
    "comentario" TEXT,
    "fecha" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opinion_pkey" PRIMARY KEY ("opinion_id")
);

-- CreateTable
CREATE TABLE "recurso_educativo" (
    "recurso_id" SERIAL NOT NULL,
    "libro_id" INTEGER NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "url" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "recurso_educativo_pkey" PRIMARY KEY ("recurso_id")
);

-- CreateTable
CREATE TABLE "lista" (
    "lista_id" SERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "tipo" VARCHAR(50),
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lista_pkey" PRIMARY KEY ("lista_id")
);

-- CreateTable
CREATE TABLE "lista_lectura" (
    "lista_id" INTEGER NOT NULL,
    "docente_id" INTEGER NOT NULL,
    "descripcion" TEXT,
    "nivel" VARCHAR(50),
    "fecha_creacion" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lista_lectura_pkey" PRIMARY KEY ("lista_id","docente_id")
);

-- CreateTable
CREATE TABLE "lista_libro" (
    "lista_id" INTEGER NOT NULL,
    "libro_id" INTEGER NOT NULL,

    CONSTRAINT "lista_libro_pkey" PRIMARY KEY ("lista_id","libro_id")
);

-- CreateTable
CREATE TABLE "radio_episodio" (
    "episodio_id" SERIAL NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "audio_url" TEXT NOT NULL,
    "programa" VARCHAR(100),
    "fecha_emision" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "radio_episodio_pkey" PRIMARY KEY ("episodio_id")
);

-- CreateTable
CREATE TABLE "foro" (
    "foro_id" SERIAL NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "creador_id" INTEGER,
    "episodio_id" INTEGER,
    "es_apl" BOOLEAN NOT NULL DEFAULT false,
    "fecha_creacion" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foro_pkey" PRIMARY KEY ("foro_id")
);

-- CreateTable
CREATE TABLE "comentario_foro" (
    "comentario_id" SERIAL NOT NULL,
    "foro_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "contenido" TEXT NOT NULL,
    "fecha" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentario_foro_pkey" PRIMARY KEY ("comentario_id")
);

-- CreateTable
CREATE TABLE "club_lectura" (
    "club_id" SERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "fecha_inicio" DATE,
    "fecha_fin" DATE,
    "orador" VARCHAR(255),

    CONSTRAINT "club_lectura_pkey" PRIMARY KEY ("club_id")
);

-- CreateTable
CREATE TABLE "usuario_club_lectura" (
    "usuario_id" INTEGER NOT NULL,
    "club_id" INTEGER NOT NULL,
    "fecha_ingreso" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "rol_en_club" VARCHAR(50),

    CONSTRAINT "usuario_club_lectura_pkey" PRIMARY KEY ("usuario_id","club_id")
);

-- CreateTable
CREATE TABLE "medalla" (
    "medalla_id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "tipo_accion" VARCHAR(50),
    "fecha_creacion" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medalla_pkey" PRIMARY KEY ("medalla_id")
);

-- CreateTable
CREATE TABLE "usuario_medalla" (
    "usuario_id" INTEGER NOT NULL,
    "medalla_id" INTEGER NOT NULL,
    "fecha_obtenida" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_medalla_pkey" PRIMARY KEY ("usuario_id","medalla_id")
);

-- CreateTable
CREATE TABLE "exportacion" (
    "exportacion_id" SERIAL NOT NULL,
    "fecha_exportacion" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "usuario_admin_id" INTEGER,
    "cantidad_opiniones_exportadas" INTEGER,
    "formato_archivo" VARCHAR(50),
    "estado" VARCHAR(50),

    CONSTRAINT "exportacion_pkey" PRIMARY KEY ("exportacion_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rol_nombre_rol_key" ON "rol"("nombre_rol");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "usuario_rol_id_idx" ON "usuario"("rol_id");

-- CreateIndex
CREATE INDEX "actividad_feed_fecha_idx" ON "actividad_feed"("fecha" DESC);

-- CreateIndex
CREATE INDEX "opinion_libro_id_idx" ON "opinion"("libro_id");

-- CreateIndex
CREATE INDEX "opinion_usuario_id_idx" ON "opinion"("usuario_id");

-- CreateIndex
CREATE INDEX "recurso_educativo_libro_id_idx" ON "recurso_educativo"("libro_id");

-- CreateIndex
CREATE INDEX "foro_episodio_id_idx" ON "foro"("episodio_id");

-- CreateIndex
CREATE INDEX "comentario_foro_foro_id_idx" ON "comentario_foro"("foro_id");

-- CreateIndex
CREATE INDEX "comentario_foro_usuario_id_idx" ON "comentario_foro"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "medalla_nombre_key" ON "medalla"("nombre");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "rol"("rol_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "actividad_feed" ADD CONSTRAINT "actividad_feed_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorito" ADD CONSTRAINT "fk_libro" FOREIGN KEY ("libro_id") REFERENCES "libro"("libro_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "favorito" ADD CONSTRAINT "fk_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "opinion" ADD CONSTRAINT "opinion_libro_id_fkey" FOREIGN KEY ("libro_id") REFERENCES "libro"("libro_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "opinion" ADD CONSTRAINT "opinion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recurso_educativo" ADD CONSTRAINT "recurso_educativo_libro_id_fkey" FOREIGN KEY ("libro_id") REFERENCES "libro"("libro_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lista_lectura" ADD CONSTRAINT "lista_lectura_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lista_lectura" ADD CONSTRAINT "lista_lectura_lista_id_fkey" FOREIGN KEY ("lista_id") REFERENCES "lista"("lista_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lista_libro" ADD CONSTRAINT "lista_libro_libro_id_fkey" FOREIGN KEY ("libro_id") REFERENCES "libro"("libro_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lista_libro" ADD CONSTRAINT "lista_libro_lista_id_fkey" FOREIGN KEY ("lista_id") REFERENCES "lista"("lista_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "foro" ADD CONSTRAINT "foro_creador_id_fkey" FOREIGN KEY ("creador_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "foro" ADD CONSTRAINT "foro_episodio_id_fkey" FOREIGN KEY ("episodio_id") REFERENCES "radio_episodio"("episodio_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentario_foro" ADD CONSTRAINT "comentario_foro_foro_id_fkey" FOREIGN KEY ("foro_id") REFERENCES "foro"("foro_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "comentario_foro" ADD CONSTRAINT "comentario_foro_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuario_club_lectura" ADD CONSTRAINT "usuario_club_lectura_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club_lectura"("club_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuario_club_lectura" ADD CONSTRAINT "usuario_club_lectura_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuario_medalla" ADD CONSTRAINT "usuario_medalla_medalla_id_fkey" FOREIGN KEY ("medalla_id") REFERENCES "medalla"("medalla_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuario_medalla" ADD CONSTRAINT "usuario_medalla_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exportacion" ADD CONSTRAINT "exportacion_usuario_admin_id_fkey" FOREIGN KEY ("usuario_admin_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

