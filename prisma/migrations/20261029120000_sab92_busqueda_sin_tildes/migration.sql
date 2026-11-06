CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

-- unaccent() no es IMMUTABLE; el wrapper permite usarlo en índices
CREATE OR REPLACE FUNCTION public.f_unaccent(text)
  RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
AS $$ SELECT extensions.unaccent('extensions.unaccent'::regdictionary, $1) $$;

-- Opcional (ver 2.3): índice trigram para que el LIKE '%...%' no recorra toda la tabla
-- CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
-- CREATE INDEX IF NOT EXISTS idx_libro_titulo_unaccent ON libro USING gin (lower(f_unaccent(titulo)) extensions.gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_libro_autor_unaccent  ON libro USING gin (lower(f_unaccent(autor))  extensions.gin_trgm_ops);
