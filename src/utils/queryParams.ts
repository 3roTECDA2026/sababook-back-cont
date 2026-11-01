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

// SAB-060: entero positivo (IDs, años), o undefined si no vino.
// Si vino pero no es un entero positivo, es un error.
export const getPositiveIntParam = (
  query: Record<string, unknown>,
  key: string
): number | undefined => {
  const text = getStringParam(query, key);
  if (text === undefined) return undefined;

  const value = Number(text);
  if (!/^\d+$/.test(text) || !Number.isSafeInteger(value) || value <= 0) {
    throw new QueryParamError(`El parámetro ${key} debe ser un número entero positivo.`);
  }
  return value;
};

// SAB-060: uno de los valores permitidos, o undefined si no vino.
export const getEnumParam = <T extends string>(
  query: Record<string, unknown>,
  key: string,
  allowed: readonly T[]
): T | undefined => {
  const text = getStringParam(query, key);
  if (text === undefined) return undefined;

  if (!allowed.includes(text as T)) {
    throw new QueryParamError(`El parámetro ${key} no es válido. Valores posibles: ${allowed.join(', ')}.`);
  }
  return text as T;
};
