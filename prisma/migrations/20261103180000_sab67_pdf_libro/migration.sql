-- SAB-67: material de lectura en PDF.
-- Ruta del archivo dentro del bucket de Supabase Storage (no una URL: no depende del ambiente).
-- NULL = el libro no tiene PDF.
ALTER TABLE "libro" ADD COLUMN IF NOT EXISTS "pdf_path" TEXT;
