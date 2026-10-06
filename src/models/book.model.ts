// src/models/book.model.ts
import { Prisma, libro as Libro } from '@prisma/client';
import { prisma } from '../db/connect/db';

export interface CrearLibroData {
  titulo: string;
  autor: string;
  genero?: string;
  descripcion?: string;
  portadaUrl?: string;     // Recibe camelCase desde el controller/frontend
  portada_url?: string;    // O recibe snake_case
  nivelEducativo?: string;
  nivel_educativo?: string;
  activo?: boolean;
}

export interface ActualizarLibroData {
  titulo?: string;
  autor?: string;
  genero?: string;
  descripcion?: string;
  portadaUrl?: string;
  portada_url?: string;
  nivelEducativo?: string;
  nivel_educativo?: string;
  activo?: boolean;
}

interface BuscarLibrosFiltros {
  query?: string;
  genero?: string;
  nivel_educativo?: string;
}

// Crear libro transformando camelCase a snake_case para Prisma
export const crearLibro = async (datos: CrearLibroData): Promise<Libro> => {
  try {
    return await prisma.libro.create({
      data: {
        titulo: datos.titulo,
        autor: datos.autor,
        genero: datos.genero,
        descripcion: datos.descripcion,
        // Asigna portadaUrl o portada_url al campo correcto en Prisma (portada_url)
        portada_url: datos.portadaUrl || datos.portada_url || null,
        nivel_educativo: datos.nivelEducativo || datos.nivel_educativo || null,
        activo: datos.activo ?? true,
      },
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
  try {
    return await prisma.libro.findUnique({
      where: { libro_id: id },
    });
  } catch (error) {
    console.error(`Error al obtener libro ${id}:`, error);
    throw error;
  }
};

// Buscar libros con filtros
export const buscarLibros = async ({
  query,
  genero,
  nivel_educativo,
}: BuscarLibrosFiltros): Promise<Libro[]> => {
  try {
    const whereClause: Prisma.libroWhereInput = {};

    if (query && query.trim() !== '') {
      const cleanQuery = query.trim();
      whereClause.OR = [
        { titulo: { contains: cleanQuery, mode: 'insensitive' } },
        { autor: { contains: cleanQuery, mode: 'insensitive' } },
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
  } catch (error) {
    console.error('Error al buscar libros:', error);
    throw error;
  }
};

// Actualizar libro
export const actualizarLibro = async (id: number, datos: ActualizarLibroData): Promise<Libro> => {
  try {
    const portada = datos.portadaUrl !== undefined ? datos.portadaUrl : datos.portada_url;
    const nivel = datos.nivelEducativo !== undefined ? datos.nivelEducativo : datos.nivel_educativo;

    return await prisma.libro.update({
      where: { libro_id: id },
      data: {
        ...(datos.titulo && { titulo: datos.titulo }),
        ...(datos.autor && { autor: datos.autor }),
        ...(datos.genero !== undefined && { genero: datos.genero }),
        ...(datos.descripcion !== undefined && { descripcion: datos.descripcion }),
        ...(portada !== undefined && { portada_url: portada }),
        ...(nivel !== undefined && { nivel_educativo: nivel }),
        ...(datos.activo !== undefined && { activo: datos.activo }),
      },
    });
  } catch (error) {
    console.error(`Error al actualizar libro ${id}:`, error);
    throw error;
  }
};

// Eliminar libro físicamente
export const eliminarLibro = async (id: number): Promise<boolean> => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.opinion.deleteMany({ where: { libro_id: id } });
      await tx.favorito.deleteMany({ where: { libro_id: id } });
      await tx.lista_libro.deleteMany({ where: { libro_id: id } });
      await tx.recurso_educativo.deleteMany({ where: { libro_id: id } });

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
export const eliminacionLogica = async (id: number): Promise<Libro> => {
  try {
    return await prisma.libro.update({
      where: { libro_id: id },
      data: { activo: false },
    });
  } catch (error) {
    console.error(`Error en eliminación lógica del libro ${id}:`, error);
    throw error;
  }
};