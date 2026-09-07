import prisma from '../db/prisma';

class FavoriteService {
  // Obtener la lista de favoritos de un usuario con los datos del libro
  async obtenerPorUsuario(usuario_id: number | string) {
    return await prisma.favorito.findMany({
      where: {
        usuario_id: Number(usuario_id),
      },
      include: {
        libro: true,
      },
    });
  }

  // Marcar un libro como favorito
  async agregar(usuario_id: number | string, libro_id: number | string) {
    const uId = Number(usuario_id);
    const lId = Number(libro_id);

    return await prisma.favorito.upsert({
      where: {
        usuario_id_libro_id: {
          usuario_id: uId,
          libro_id: lId,
        },
      },
      update: {},
      create: {
        usuario_id: uId,
        libro_id: lId,
      },
      include: {
        libro: true,
      },
    });
  }

  // Eliminar de favoritos
  async eliminar(usuario_id: number | string, libro_id: number | string) {
    return await prisma.favorito.delete({
      where: {
        usuario_id_libro_id: {
          usuario_id: Number(usuario_id),
          libro_id: Number(libro_id),
        },
      },
    });
  }

  // Comprobar si es favorito
  async esFavorito(usuario_id: number | string, libro_id: number | string) {
    const favorito = await prisma.favorito.findUnique({
      where: {
        usuario_id_libro_id: {
          usuario_id: Number(usuario_id),
          libro_id: Number(libro_id),
        },
      },
    });
    return Boolean(favorito);
  }
}

export default new FavoriteService();