import { getGeminiKey } from '../config/get-gemini-key';
import { FallbackModeratorProvider } from '../providers/fallback.provider';
import { GeminiModeratorProvider } from '../providers/gemini.provider';
import { ModerationResult } from '../types/moderation.types';

export const moderateText = async (text: string, contextDescription?: string): Promise<ModerationResult> => {
  if (!text || !text.trim()) {
    return { isAppropriate: true };
  }

  const apiKey = await getGeminiKey();

  if (apiKey) {
    try {
      const gemini = new GeminiModeratorProvider(apiKey);
      return await gemini.moderate(text, contextDescription);
    } catch (error) {
      console.warn('⚠️ Fallback a moderacion local por error en Gemini API:', error);
    }
  }

  const fallback = new FallbackModeratorProvider();
  return fallback.moderate(text, contextDescription);
};
