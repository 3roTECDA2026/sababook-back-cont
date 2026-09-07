import prisma from '../db/prisma';

export interface CreateListaData {
  nombre: string;
  descripcion?: string;
  tipo?: string;
  nivel?: string;
}

class ListaService {
  // Obtener todas las listas asociadas a un usuario/docente
  async obtenerPorUsuario(usuario_id: number | string) {
    return await prisma.lista.findMany({
      where: {
        lista_lectura: {
          some: {
            docente_id: Number(usuario_id),
          },
        },
      },
      include: {
        lista_lectura: true,
        lista_libro: {
          include: {
            libro: true,
          },
        },
      },
      orderBy: {
        fecha_creacion: 'desc',
      },
    });
  }

  // Obtener una lista por su lista_id
  async obtenerPorId(lista_id: number | string) {
    return await prisma.lista.findUnique({
      where: {
        lista_id: Number(lista_id),
      },
      include: {
        lista_lectura: {
          include: {
            usuario: {
              select: {
                usuario_id: true,
                nombre: true,
                email: true,
              },
            },
          },
        },
        lista_libro: {
          include: {
            libro: true,
          },
        },
      },
    });
  }

  // Crear una lista y asociarla opcionalmente al usuario/docente en lista_lectura
  async crear(usuario_id: number | string, data: CreateListaData) {
    const uId = Number(usuario_id);

    return await prisma.lista.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipo: data.tipo ?? 'docente',
        lista_lectura: {
          create: {
            docente_id: uId,
            descripcion: data.descripcion,
            nivel: data.nivel,
          },
        },
      },
      include: {
        lista_lectura: true,
      },
    });
  }

  // Eliminar una lista por su lista_id (el borrado en cascada de Prisma eliminará las entradas en lista_lectura y lista_libro)
  async eliminar(lista_id: number | string) {
    return await prisma.lista.delete({
      where: {
        lista_id: Number(lista_id),
      },
    });
  }
}

export default new ListaService();