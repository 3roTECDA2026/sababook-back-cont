import { prisma } from '../../../db/connect/db';

export const saveGeminiKey = async (apiKey: string): Promise<void> => {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    throw new Error('API key cannot be empty');
  }

  await prisma.configuracion_sistema.upsert({
    where: { clave: 'gemini_api_key' },
    update: { valor: trimmedKey, actualizado: new Date() },
    create: {
      clave: 'gemini_api_key',
      valor: trimmedKey,
      descripcion: 'Google Gemini API Key para moderación de contenido',
    },
  });
};
