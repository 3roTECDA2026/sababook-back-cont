ALTER TABLE favorito
ADD COLUMN IF NOT EXISTS estado_lectura VARCHAR(20) NOT NULL DEFAULT 'general';

UPDATE favorito
SET estado_lectura = 'general'
WHERE estado_lectura IS NULL;

ALTER TABLE favorito
DROP CONSTRAINT IF EXISTS favorito_estado_lectura_check;

ALTER TABLE favorito
ADD CONSTRAINT favorito_estado_lectura_check
CHECK (estado_lectura IN ('general', 'quiero-leer', 'leyendo', 'leido'));
