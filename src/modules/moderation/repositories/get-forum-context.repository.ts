import { prisma } from '../../../db/connect/db';

export const getForumContext = async (foroId: number): Promise<string | null> => {
  if (!foroId || isNaN(foroId)) return null;

  try {
    const foro = await prisma.foro.findUnique({
      where: { foro_id: foroId },
      select: { titulo: true, descripcion: true },
    });

    if (!foro) return null;
    return `Foro: "${foro.titulo}". Descripción: "${foro.descripcion || 'Sin descripción'}"`;
  } catch {
    return null;
  }
};
