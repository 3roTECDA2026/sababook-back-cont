import { ModeratorProvider, ModerationResult } from '../types/moderation.types';

const OFFENSIVE_TERMS = [
  'pelotudo', 'boludo', 'mierda', 'puto', 'hdp', 'forro', 'concha',
  'idiota', 'estupido', 'tarado', 'imbecil', 'puta', 'garca'
];

export class FallbackModeratorProvider implements ModeratorProvider {
  async moderate(text: string): Promise<ModerationResult> {
    const normalized = text.toLowerCase();
    const found = OFFENSIVE_TERMS.find(term => normalized.includes(term));

    if (found) {
      return {
        isAppropriate: false,
        reason: 'Lenguaje inapropiado o potencialmente ofensivo detectado',
        category: 'toxicidad_local',
      };
    }

    return { isAppropriate: true };
  }
}
