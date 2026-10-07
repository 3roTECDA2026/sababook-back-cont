import { ModeratorProvider, ModerationResult } from '../types/moderation.types';

const OFFENSIVE_TERMS = [
  'pelotudo', 'boludo', 'mierda', 'puto', 'hdp', 'forro', 'concha',
  'idiota', 'estupido', 'tarado', 'imbecil', 'puta', 'garca', 'cagon',
  'malparido', 'forra', 'pelotuda', 'boluda', 'basura', 'maldito', 'perra'
];

export class FallbackModeratorProvider implements ModeratorProvider {
  async moderate(text: string, _contextDescription?: string): Promise<ModerationResult> {
    // Normalizar tildes y diacríticos
    const normalized = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

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
