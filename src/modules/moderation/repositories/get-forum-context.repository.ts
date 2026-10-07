import { prisma } from '../../../db/connect/db';

export const getForumContext = async (foroId: number): Promise<string | null> => {
  if (!foroId || isNaN(foroId)) return null;

  try {
    const foro = await prisma.foro.findUnique({
      where: { foro_id: foroId },
      select: {
        titulo: true,
        descripcion: true,
        comentario_foro: {
          take: 5,
          orderBy: { fecha: 'desc' },
          select: {
            contenido: true,
            usuario: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
    });

    if (!foro) return null;

    let context = `Foro: "${foro.titulo}". Descripción: "${foro.descripcion || 'Sin descripción'}"`;

    if (foro.comentario_foro && foro.comentario_foro.length > 0) {
      const recentComments = [...foro.comentario_foro].reverse();
      const formattedComments = recentComments
        .map((c) => `- ${c.usuario?.nombre || 'Usuario'}: "${c.contenido}"`)
        .join('\n');

      context += `\nÚltimos comentarios en el debate:\n${formattedComments}`;
    }

    return context;
  } catch {
    return null;
  }
};

