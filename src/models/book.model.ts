// src/models/book.model.ts
import { Prisma, libro as Libro } from '@prisma/client';
import { prisma } from '../db/connect/db';
import { PaginationParams, Paginated, buildPaginated } from '../utils/pagination';

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

export interface BuscarLibrosFiltros {
  query?: string;
  titulo?: string;
  autor?: string;
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
export const buscarLibros = async (filtros: BuscarLibrosFiltros): Promise<Libro[]> => {
  try {
    return await prisma.libro.findMany({ where: await construirWhere(filtros) });
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


type TextSearchColumn = 'titulo' | 'autor';

// Escapa los comodines de LIKE para que el texto del usuario se busque literal
const escapeLikePattern = (text: string): string => text.replace(/[\\%_]/g, '\\$&');

// Ids de los libros cuyo título/autor contiene el texto, ignorando tildes y mayúsculas
const findBookIdsByText = async (
  text: string,
  columns: TextSearchColumn[]
): Promise<number[]> => {
  const pattern = `%${escapeLikePattern(text.trim())}%`;

  const conditions = columns.map(
    (column) =>
      Prisma.sql`lower(public.f_unaccent(${Prisma.raw(column)})) LIKE lower(public.f_unaccent(${pattern}))`
  );

  const rows = await prisma.$queryRaw<{ libro_id: number }[]>`
    SELECT libro_id FROM libro WHERE ${Prisma.join(conditions, ' OR ')}
  `;

  return rows.map((row) => row.libro_id);
};


const construirWhere = async ({
  query,
  titulo,
  autor,
  genero,
  nivel_educativo,
}: BuscarLibrosFiltros): Promise<Prisma.libroWhereInput> => {
  const where: Prisma.libroWhereInput = {};
  const idFilters: number[][] = [];

  if (query?.trim()) idFilters.push(await findBookIdsByText(query, ['titulo', 'autor']));
  if (titulo?.trim()) idFilters.push(await findBookIdsByText(titulo, ['titulo']));
  if (autor?.trim()) idFilters.push(await findBookIdsByText(autor, ['autor']));

  if (idFilters.length > 0) {
    where.AND = idFilters.map((ids) => ({ libro_id: { in: ids } }));
  }
  if (genero) where.genero = { equals: genero, mode: 'insensitive' };
  if (nivel_educativo) where.nivel_educativo = { equals: nivel_educativo, mode: 'insensitive' };

  return where;
};

export const buscarLibrosPaginado = async (
  filtros: BuscarLibrosFiltros,
  pagination: PaginationParams
): Promise<Paginated<Libro>> => {
  try {
    const where = await construirWhere(filtros);

    const [data, total] = await prisma.$transaction([
      prisma.libro.findMany({
        where,
        orderBy: { libro_id: 'asc' }, // orden estable: evita repetidos/saltos
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.libro.count({ where }),
    ]);

    return buildPaginated(data, total, pagination);
  } catch (error) {
    console.error('Error al buscar libros paginados:', error);
    throw error;
  }
};

