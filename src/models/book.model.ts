// src/models/book.model.ts
import { Prisma, libro as Libro } from '@prisma/client';
import { prisma } from '../db/connect/db';

type CrearLibroData = Prisma.libroCreateInput;
type ActualizarLibroData = Prisma.libroUpdateInput;

interface BuscarLibrosFiltros {
  query?: string;
  genero?: string;
  nivel_educativo?: string;
}

// Crear libro
export const crearLibro = async (datos: CrearLibroData): Promise<Libro> => {
  try {
    return await prisma.libro.create({
      data: datos,
    });
  } catch (error) {
    console.error('Error al crear libro:', error);
    throw error;
  }
};

// Obtener todos los libros
export const obtenerTodos = async (): Promise<Libro[]> => {
  try {
    return await prisma.libro.findMany();
  } catch (error) {
    console.error('Error al obtener todos los libros:', error);
    throw error;
  }
};

// Obtener libro por ID
export const obtenerPorId = async (id: number): Promise<Libro | null> => {
  return await prisma.libro.findUnique({
    where: { libro_id: id },
  });
};

// Buscar libros con filtros
export const buscarLibros = async ({
  query,
  genero,
  nivel_educativo,
}: BuscarLibrosFiltros): Promise<Libro[]> => {
  const whereClause: Prisma.libroWhereInput = {};

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

  return await prisma.libro.findMany({
    where: whereClause,
  });
};

// Actualizar libro
export const actualizarLibro = async (id: number, datos: ActualizarLibroData): Promise<void> => {
  await prisma.libro.update({
    where: { libro_id: id },
    data: datos,
  });
};

// Eliminar libro físicamente (mediante transacción)
export const eliminarLibro = async (id: number): Promise<boolean> => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.opinion.deleteMany({
        where: { libro_id: id },
      });

      return await tx.libro.delete({
        where: { libro_id: id },
      });
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