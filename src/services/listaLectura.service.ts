import prisma from '../db/prisma';

export interface CreateListaData {
  nombre: string;
  descripcion?: string;
  tipo?: string;
  docente_id: number;
  nivel?: string;
  libros_ids?: number[];
}

class ListaLecturaService {
  // Obtener todas las listas de lectura
  async obtenerTodas() {
    return await prisma.lista.findMany({
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
      orderBy: {
        fecha_creacion: 'desc',
      },
    });
  }

  // Obtener una lista por su lista_id
  async obtenerPorId(lista_id: number | string) {
    return await prisma.lista.findUnique({
      where: { lista_id: Number(lista_id) },
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

  // Crear una lista asociada al docente
  async crear(data: CreateListaData) {
    const docenteId = Number(data.docente_id);

    return await prisma.lista.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipo: data.tipo ?? 'docente',
        lista_lectura: {
          create: {
            docente_id: docenteId,
            descripcion: data.descripcion,
            nivel: data.nivel,
          },
        },
        lista_libro: data.libros_ids && data.libros_ids.length > 0 ? {
          create: data.libros_ids.map((libro_id) => ({
            libro_id: Number(libro_id),
          })),
        } : undefined,
      },
      include: {
        lista_lectura: true,
        lista_libro: {
          include: {
            libro: true,
          },
        },
      },
    });
  }

  // Agregar un libro a la lista
  async agregarLibro(lista_id: number | string, libro_id: number | string) {
    return await prisma.lista_libro.create({
      data: {
        lista_id: Number(lista_id),
        libro_id: Number(libro_id),
      },
    });
  }

  // Eliminar un libro de la lista
  async quitarLibro(lista_id: number | string, libro_id: number | string) {
    return await prisma.lista_libro.delete({
      where: {
        lista_id_libro_id: {
          lista_id: Number(lista_id),
          libro_id: Number(libro_id),
        },
      },
    });
  }

  // Eliminar la lista completa
  async eliminar(lista_id: number | string) {
    return await prisma.lista.delete({
      where: {
        lista_id: Number(lista_id),
      },
    });
  }
}

export default new ListaLecturaService();