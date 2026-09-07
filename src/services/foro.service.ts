import prisma from '../db/prisma';

export interface CrearPostData {
  titulo: string;
  descripcion?: string;
}

class ForoService {
  // Obtener todos los temas de debate del foro con su creador
  async obtenerTodos() {
    return await prisma.foro.findMany({
      include: {
        usuario: {
          select: {
            usuario_id: true,
            nombre: true,
            avatar_url: true,
          },
        },
        comentario_foro: {
          select: {
            comentario_id: true,
          },
        },
      },
      orderBy: {
        fecha_creacion: 'desc',
      },
    });
  }

  // Obtener un tema del foro por ID con su creador y todos sus comentarios (ordenados por fecha)
  async obtenerPorId(id: number | string) {
    return await prisma.foro.findUnique({
      where: {
        foro_id: Number(id),
      },
      include: {
        usuario: {
          select: {
            usuario_id: true,
            nombre: true,
            avatar_url: true,
          },
        },
        comentario_foro: {
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
            fecha: 'asc',
          },
        },
      },
    });
  }

  // Crear una nueva publicación / tema en el foro
  async crear(creador_id: number | string, data: CrearPostData) {
    return await prisma.foro.create({
      data: {
        creador_id: Number(creador_id),
        titulo: data.titulo,
        descripcion: data.descripcion,
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

  // Agregar un comentario a un tema del foro
  async agregarComentario(foro_id: number | string, usuario_id: number | string, contenido: string) {
    return await prisma.comentario_foro.create({
      data: {
        foro_id: Number(foro_id),
        usuario_id: Number(usuario_id),
        contenido,
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

  // Eliminar un comentario del foro
  async eliminarComentario(comentario_id: number | string, usuario_id: number | string) {
    return await prisma.comentario_foro.deleteMany({
      where: {
        comentario_id: Number(comentario_id),
        usuario_id: Number(usuario_id),
      },
    });
  }

  // Eliminar un hilo del foro
  async eliminarForo(foro_id: number | string) {
    return await prisma.foro.delete({
      where: {
        foro_id: Number(foro_id),
      },
    });
  }
}

export default new ForoService();