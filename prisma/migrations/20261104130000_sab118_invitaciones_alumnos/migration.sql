-- SAB-118: alta de alumnos por invitación institucional.
-- Las cuentas creadas desde una planilla quedan PENDIENTES hasta que el alumno define su contraseña.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EstadoCuenta') THEN
    CREATE TYPE "EstadoCuenta" AS ENUM ('PENDIENTE', 'ACTIVA');
  END IF;
END $$;

ALTER TABLE "usuario"
  ADD COLUMN IF NOT EXISTS "estado_cuenta" "EstadoCuenta" NOT NULL DEFAULT 'ACTIVA';

CREATE TABLE IF NOT EXISTS "invitacion" (
  "invitacion_id"  SERIAL PRIMARY KEY,
  "usuario_id"     INTEGER NOT NULL,
  "token"          VARCHAR(128) NOT NULL,
  "expira_en"      TIMESTAMPTZ(6) NOT NULL,
  "usada"          BOOLEAN NOT NULL DEFAULT false,
  "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "invitacion_token_key" UNIQUE ("token"),
  CONSTRAINT "invitacion_usuario_id_fkey" FOREIGN KEY ("usuario_id")
    REFERENCES "usuario"("usuario_id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS "invitacion_usuario_id_idx" ON "invitacion"("usuario_id");
