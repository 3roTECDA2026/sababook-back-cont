// src/services/opinion-content.service.ts
//
// SAB-039 - Reglas de validación de contenido para reseñas (opinion).
// La moderación con IA (modules/moderation) revisa el tono y la convivencia
// escolar; estas reglas cubren lo que un modelo no ve: texto demasiado corto
// o que no parece español (ataque de teclado, spam).

export const MIN_COMENTARIO = 10;
export const MIN_LETRAS = 4;

const CON_VOCALES = /[aeiouáéíóúüñ]/;
const LETRAS = /[a-záéíóúüñ]/g;

export interface ResultadoValidacion {
  valido: boolean;
  error?: string;
}

/** Texto con menos caracteres alfabéticos de los exigidos: "!!!", "1234". */
const tienePocasLetras = (texto: string): boolean =>
  (texto.toLowerCase().match(LETRAS) ?? []).length < MIN_LETRAS;

/** Secuencia sin una sola vocal: no es español, es teclado golpeado. */
const esAtaqueTeclado = (texto: string): boolean => {
  const limpio = texto.toLowerCase().replace(/[^a-záéíóúüñ0-9]/g, '');
  return limpio.length >= 3 && !CON_VOCALES.test(limpio);
};

/** Racha o bloque repetido: "ñiñiñi", "siiii", "ffff", "holaaa". */
const esRepetitivo = (texto: string): boolean => {
  const limpio = texto.toLowerCase().replace(/\s/g, '');
  if (limpio.length < 4) return false;
  // Solo letras: los dígitos ("1000") no cuentan para la racha.
  if (/([a-záéíóúüñ])\1{2,}/.test(limpio)) return true;
  if (new Set(limpio).size <= 2) return true;
  for (let largo = 1; largo <= 3; largo++) {
    if (limpio.length % largo !== 0) continue;
    const bloque = limpio.slice(0, largo);
    if (limpio === bloque.repeat(limpio.length / largo)) return true;
  }
  return false;
};

/**
 * Valida el texto de una reseña. Devuelve `valido: true` cuando el contenido
 * es apto; en caso contrario, el mensaje de error para responder al usuario.
 */
export const validarComentarioOpinion = (comentario: unknown): ResultadoValidacion => {
  if (typeof comentario !== 'string' || comentario.trim().length === 0) {
    return { valido: false, error: 'Escribí un comentario para publicar tu reseña.' };
  }

  const texto = comentario.trim();

  if (texto.length < MIN_COMENTARIO) {
    return {
      valido: false,
      error: `Tu reseña es muy corta. Contá un poco más (mínimo ${MIN_COMENTARIO} caracteres).`,
    };
  }

  if (tienePocasLetras(texto)) {
    return {
      valido: false,
      error: 'Tu reseña debe tener al menos una oración escrita.',
    };
  }

  if (esAtaqueTeclado(texto)) {
    return {
      valido: false,
      error: 'Tu reseña no parece un texto válido. Revisala antes de publicar.',
    };
  }

  if (esRepetitivo(texto)) {
    return {
      valido: false,
      error: 'Tu reseña repite caracteres sin sentido. Escribí un comentario real.',
    };
  }

  return { valido: true };
};
