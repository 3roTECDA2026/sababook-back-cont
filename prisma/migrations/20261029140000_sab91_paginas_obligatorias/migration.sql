-- SAB-91: eliminar las 100 páginas automáticas
ALTER TABLE "libro"
ALTER COLUMN "paginas_totales" DROP DEFAULT;

-- Exigir que todos los libros tengan páginas
ALTER TABLE "libro"
ALTER COLUMN "paginas_totales" SET NOT NULL;

-- Impedir valores iguales o menores que cero
ALTER TABLE "libro"
ADD CONSTRAINT "libro_paginas_totales_positivas"
CHECK ("paginas_totales" > 0);