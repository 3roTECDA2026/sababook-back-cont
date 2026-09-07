import prisma from '../db/prisma';

export interface CreateOpinionData {
  usuario_id: number | string;
  libro_id: number | string;
  calificacion?: number;
  comentario?: string;
}

class OpinionService {
  // Obtener todas las opiniones de un libro específico
  async obtenerPorLibro(libro_id: number | string) {
    return await prisma.opinion.findMany({
      where: {
        libro_id: Number(libro_id),
      },
      include: {
        usuario: {
          select: {
            usuario_id: true,
            nombre: true,
            avatar_url: true,
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  // Crear una nueva opinión o reseña
  async crear(usuario_id: number | string, libro_id: number | string, calificacion?: number, texto?: string) {
    return await prisma.opinion.create({
      data: {
        usuario_id: Number(usuario_id),
        libro_id: Number(libro_id),
        calificacion: calificacion ? Number(calificacion) : null,
        comentario: texto,
      },
      include: {
        usuario: {
          select: {
            usuario_id: true,
            nombre: true,
            avatar_url: true,
          },
        },
      },
    });
  }

  // Eliminar una opinión por su opinion_id verificando el usuario
  async eliminar(opinion_id: number | string, usuario_id: number | string) {
    return await prisma.opinion.deleteMany({
      where: {
        opinion_id: Number(opinion_id),
        usuario_id: Number(usuario_id),
      },
    });
  }
}

export default new OpinionService();