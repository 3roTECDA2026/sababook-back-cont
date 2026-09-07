import prisma from '../db/prisma';

export interface BookData {
  titulo: string;
  autor: string;
  genero?: string;
  descripcion?: string;
  portada_url?: string;
  nivel_educativo?: string;
  calificacion_promedio?: number;
  activo?: boolean;
}

class BookService {
  // Obtener todos los libros activos
  async obtenerTodos() {
    return await prisma.libro.findMany({
      where: {
        activo: true,
      },
      orderBy: {
        libro_id: 'desc',
      },
    });
  }

  // Obtener un libro por ID junto con sus opiniones/comentarios y recursos educativos
  async obtenerPorId(id: number | string) {
    return await prisma.libro.findUnique({
      where: {
        libro_id: Number(id),
      },
      include: {
        opinion: {
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
        },
        recurso_educativo: true,
      },
    });
  }

  // Crear un nuevo libro
  async crear(data: BookData) {
    return await prisma.libro.create({
      data: {
        titulo: data.titulo,
        autor: data.autor,
        genero: data.genero,
        descripcion: data.descripcion,
        portada_url: data.portada_url,
        nivel_educativo: data.nivel_educativo,
        calificacion_promedio: data.calificacion_promedio,
        activo: data.activo ?? true,
      },
    });
  }

  // Actualizar datos de un libro
  async actualizar(id: number | string, data: Partial<BookData>) {
    return await prisma.libro.update({
      where: {
        libro_id: Number(id),
      },
      data,
    });
  }

  // Borrado lógico (recomendado) o borrado físico
  async eliminar(id: number | string, borradoFisico: boolean = false) {
    const libroId = Number(id);

    if (borradoFisico) {
      return await prisma.libro.delete({
        where: { libro_id: libroId },
      });
    }

    // Marca el libro como inactivo
    return await prisma.libro.update({
      where: { libro_id: libroId },
      data: { activo: false },
    });
  }

  // Búsqueda por título, autor o género
  async buscar(query: string) {
    return await prisma.libro.findMany({
      where: {
        activo: true,
        OR: [
          { titulo: { contains: query, mode: 'insensitive' } },
          { autor: { contains: query, mode: 'insensitive' } },
          { genero: { contains: query, mode: 'insensitive' } },
        ],
      },
    });
  }
}

export default new BookService();