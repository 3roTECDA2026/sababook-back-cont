import { prisma } from '../../../db/connect/db';

export const getGeminiKey = async (): Promise<string | null> => {
  try {
    const config = await prisma.configuracion_sistema.findUnique({
      where: { clave: 'gemini_api_key' },
    });
    if (config?.valor?.trim()) {
      return config.valor.trim();
    }
  } catch (error) {
    // Database access fallback
  }

  return process.env.GEMINI_API_KEY?.trim() || null;
};
