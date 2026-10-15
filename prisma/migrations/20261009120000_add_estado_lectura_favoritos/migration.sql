ALTER TABLE "favorito"
ADD COLUMN IF NOT EXISTS "estado_lectura"
VARCHAR(20) NOT NULL DEFAULT 'general';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'favorito_estado_lectura_check'
          AND conrelid = 'favorito'::regclass
    ) THEN
        ALTER TABLE "favorito"
        ADD CONSTRAINT "favorito_estado_lectura_check"
        CHECK (
            "estado_lectura" IN (
                'general',
                'quiero-leer',
                'leyendo',
                'leido'
            )
        );
    END IF;
END $$;
