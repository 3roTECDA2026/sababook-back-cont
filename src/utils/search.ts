// src/utils/search.ts
import { Prisma } from '@prisma/client';

// Máximo de caracteres de un texto de búsqueda
export const MAX_SEARCH_LENGTH = 100;

// Escapa los comodines de LIKE para buscar el texto literalmente.
export const escapeLikePattern = (text: string): string =>
  text.replace(/[\\%_]/g, '\\$&');

// Condición SQL: alguna de las columnas contiene el texto, sin distinguir tildes ni mayúsculas
// (usa public.f_unaccent, creada en la migración de SAB-92).
// Las columnas tienen que ser nombres fijos del código, nunca datos que vengan del request.
export const unaccentContains = (columns: string[], text: string): Prisma.Sql => {
  const pattern = `%${escapeLikePattern(text.trim())}%`;

  return Prisma.join(
    columns.map(
      (column) =>
        Prisma.sql`lower(public.f_unaccent(${Prisma.raw(column)})) LIKE lower(public.f_unaccent(${pattern}))`
    ),
    ' OR '
  );
};
