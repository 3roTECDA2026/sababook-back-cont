import prisma from '../db/prisma';

class ComentarioService {
  // Obtener todos los comentarios/opiniones de un libro específico
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

  // Crear un nuevo comentario
  async crear(usuario_id: number | string, libro_id: number | string, contenido: string, calificacion?: number) {
    return await prisma.opinion.create({
      data: {
        usuario_id: Number(usuario_id),
        libro_id: Number(libro_id),
        comentario: contenido,
        calificacion: calificacion ?? null,
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

  // Eliminar un comentario especificando su ID y verificando el usuario
  async eliminar(id: number | string, usuario_id: number | string) {
    return await prisma.opinion.deleteMany({
      where: {
        opinion_id: Number(id),
        usuario_id: Number(usuario_id),
      },
    });
  }
}

export default new ComentarioService();