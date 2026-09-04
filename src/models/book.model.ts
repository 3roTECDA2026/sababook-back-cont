// src/models/book.model.ts
import { prisma } from '../db/connect/db.js';

export interface Libro {
  libro_id: number;
  titulo: string;
  autor: string;
  genero: string;
  nivel_educativo: string;
  descripcion: string;
  portada_url: string;
  calificacion_promedio: number;
  activo?: boolean;
}

type CrearLibroData = Partial<Omit<Libro, 'libro_id'>>;
type ActualizarLibroData = Partial<Omit<Libro, 'libro_id'>>;

interface BuscarLibrosFiltros {
  query?: string;
  genero?: string;
  nivel_educativo?: string;
}

// Crear libro
export const crearLibro = async (datos: CrearLibroData): Promise<Libro> => {
  try {
    const nuevoLibro = await prisma.libro.create({
      data: datos as any,
    });
    return nuevoLibro as unknown as Libro;
  } catch (error) {
    console.error('Error al crear libro:', error);
    throw error;
  }
};

// Obtener todos los libros
export const obtenerTodos = async (): Promise<Libro[]> => {
  try {
    const result = await prisma.libro.findMany();
    return result as unknown as Libro[];
  } catch (error) {
    console.error('Error al obtener todos los libros:', error);
    throw error;
  }
};

// Obtener libro por ID
export const obtenerPorId = async (id: number): Promise<Libro | null> => {
  const result = await prisma.libro.findUnique({
    where: { libro_id: id },
  });
  return (result as unknown as Libro) || null;
};

// Buscar libros con filtros
export const buscarLibros = async ({
  query,
  genero,
  nivel_educativo,
}: BuscarLibrosFiltros): Promise<Libro[]> => {
  const whereClause: any = {};

  if (query) {
    whereClause.OR = [
      { titulo: { contains: query, mode: 'insensitive' } },
      { autor: { contains: query, mode: 'insensitive' } },
    ];
  }

  if (genero) {
    whereClause.genero = genero;
  }

  if (nivel_educativo) {
    whereClause.nivel_educativo = nivel_educativo;
  }

  const result = await prisma.libro.findMany({
    where: whereClause,
  });

  return result as unknown as Libro[];
};

// Actualizar libro
export const actualizarLibro = async (id: number, datos: ActualizarLibroData): Promise<void> => {
  const { libro_id, ...datosAActualizar } = datos as any;

  await prisma.libro.update({
    where: { libro_id: id },
    data: datosAActualizar,
  });
};

// Eliminar libro físicamente (Maneja transacciones mediante Prisma $transaction)
export const eliminarLibro = async (id: number): Promise<boolean> => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Eliminar opiniones asociadas
      await tx.opinion.deleteMany({
        where: { libro_id: id },
      });

      // 2. Eliminar el libro principal
      const deletedBook = await tx.libro.delete({
        where: { libro_id: id },
      });

      return deletedBook;
    });

    return !!result;
  } catch (error) {
    console.error('Error al eliminar libro y sus dependencias:', error);
    throw error;
  }
};

// Eliminación lógica
export const eliminacionLogica = async (id: number): Promise<void> => {
  await prisma.libro.update({
    where: { libro_id: id },
    data: { activo: false },
  });
};