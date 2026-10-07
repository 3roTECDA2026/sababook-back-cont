import { getGeminiKey } from '../config/get-gemini-key';
import { FallbackModeratorProvider } from '../providers/fallback.provider';
import { GeminiModeratorProvider } from '../providers/gemini.provider';
import { ModerationResult } from '../types/moderation.types';

export const moderateText = async (text: string, contextDescription?: string): Promise<ModerationResult> => {
  if (!text || !text.trim()) {
    return { isAppropriate: true };
  }

  // 1. Filtro local estricto de términos ofensivos (rápido y determinístico)
  const fallback = new FallbackModeratorProvider();
  const localResult = await fallback.moderate(text, contextDescription);
  if (!localResult.isAppropriate) {
    return localResult;
  }

  // 2. Moderación mediante IA (Gemini)
  const apiKey = await getGeminiKey();

  if (apiKey) {
    try {
      const gemini = new GeminiModeratorProvider(apiKey);
      return await gemini.moderate(text, contextDescription);
    } catch (error) {
      console.warn('⚠️ Error en Gemini API, derivando a revisión manual (Fail-Closed):', error);
      throw error;
    }
  }

  // 3. Fail-Closed: Si la IA no está disponible o configurada, no dejar pasar sin moderación.
  // Se lanza error para que el middleware de moderación capture la excepción y derive a revisión manual (HTTP 202).
  throw new Error('Servicio de IA de moderación no disponible. Contenido retenido para revisión manual.');
};
