import { ModeratorProvider, ModerationResult } from '../types/moderation.types';

export class GeminiModeratorProvider implements ModeratorProvider {
  constructor(private readonly apiKey: string) {}

  async moderate(text: string): Promise<ModerationResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
    const prompt = `Actua como moderador estricto para una plataforma escolar de lectura (alumnos de secundaria).
Analiza el siguiente texto y determina si es apropiado o si contiene insultos, acoso, odio, discriminacion o amenazas.
Responde UNICAMENTE en formato JSON con la siguiente estructura:
{
  "isAppropriate": boolean,
  "reason": "motivo breve en español si no es apropiado, o vacio si es apropiado",
  "category": "insulto|acoso|discriminacion|odio|ninguna"
}

Texto a analizar:
"${text}"`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
      }),
    });

    if (!res.ok) {
      throw new Error(`Gemini API HTTP Error: ${res.status}`);
    }

    const data = await res.json();
    const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      throw new Error('Invalid response structure from Gemini API');
    }

    const parsed = JSON.parse(rawContent);
    return {
      isAppropriate: Boolean(parsed.isAppropriate),
      reason: parsed.reason || undefined,
      category: parsed.category || undefined,
    };
  }
}
