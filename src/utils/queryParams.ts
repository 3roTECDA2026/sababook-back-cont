// src/utils/queryParams.ts

// Parámetro de la URL inválido: se responde 400 con este mensaje
export class QueryParamError extends Error {}

// Devuelve el parámetro como texto (sin espacios a los costados), o undefined si no vino o está vacío.
// Express entrega un array si el parámetro se repite (?q=a&q=b): eso es un error, no un texto.
export const getStringParam = (
  query: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = query[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new QueryParamError(`El parámetro ${key} se envía una sola vez.`);
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};
