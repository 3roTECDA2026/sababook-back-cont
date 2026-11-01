// src/models/book.model.ts
import { Prisma, libro as Libro } from '@prisma/client';
import { prisma } from '../db/connect/db';
import { PaginationParams, Paginated, buildPaginated } from '../utils/pagination';
import { escapeLikePattern } from '../utils/search';

// SAB-123: la cantidad de páginas es opcional.
export interface CrearLibroData {
  titulo: string;
  autor: string;
  genero?: string;
  descripcion?: string;
  portadaUrl?: string;
  portada_url?: string;
  nivelEducativo?: string;
  nivel_educativo?: string;
  paginas_totales?: number | null;
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
  paginas_totales?: number | null;
  activo?: boolean;
}

export interface BuscarLibrosFiltros {
  query?: string;
  titulo?: string;
  autor?: string;
  genero?: string;
  nivel_educativo?: string;
}

// SAB-91: validar que el total de páginas sea un entero positivo.
const validarPaginasTotales = (valor: unknown): number | null => {
  if (valor === null || valor === undefined) {
    return null;
  }

  if (
    typeof valor !== 'number' ||
    !Number.isSafeInteger(valor) ||
    valor <= 0 ||
    valor > 2147483647
  ) {
    throw new Error(
      'El número de páginas debe ser un entero mayor que cero, o dejarse vacío.'
    );
  }

  return valor;
};

// Crear libro
export const crearLibro = async (datos: CrearLibroData): Promise<Libro> => {
  try {
    const paginasTotales = validarPaginasTotales(datos.paginas_totales);

    return await prisma.libro.create({
      data: {
        titulo: datos.titulo,
        autor: datos.autor,
        genero: datos.genero,
        descripcion: datos.descripcion,
        portada_url: datos.portadaUrl || datos.portada_url || null,
        nivel_educativo:
          datos.nivelEducativo || datos.nivel_educativo || null,
        paginas_totales: paginasTotales,
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
export const buscarLibros = async (
  filtros: BuscarLibrosFiltros
): Promise<Libro[]> => {
  try {
    const where = await construirWhere(filtros);

    return await prisma.libro.findMany({
      where,
    });
  } catch (error) {
    console.error('Error al buscar libros:', error);
    throw error;
  }
};

// Actualizar libro
export const actualizarLibro = async (
  id: number,
  datos: ActualizarLibroData
): Promise<Libro> => {
  try {
    const portada =
      datos.portadaUrl !== undefined
        ? datos.portadaUrl
        : datos.portada_url;

    const nivel =
      datos.nivelEducativo !== undefined
        ? datos.nivelEducativo
        : datos.nivel_educativo;

    // SAB-123:
    // undefined = conservar páginas existentes.
    // null = quitar cantidad de páginas.
    // número positivo = actualizar cantidad de páginas.
    const paginasTotales =
      datos.paginas_totales !== undefined
        ? validarPaginasTotales(datos.paginas_totales)
        : undefined;

    return await prisma.libro.update({
      where: { libro_id: id },
      data: {
        ...(datos.titulo && { titulo: datos.titulo }),
        ...(datos.autor && { autor: datos.autor }),
        ...(datos.genero !== undefined && { genero: datos.genero }),
        ...(datos.descripcion !== undefined && {
          descripcion: datos.descripcion,
        }),
        ...(portada !== undefined && { portada_url: portada }),
        ...(nivel !== undefined && { nivel_educativo: nivel }),
        ...(paginasTotales !== undefined && {
          paginas_totales: paginasTotales,
        }),
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

// SAB-092: búsqueda sin distinguir tildes ni mayúsculas.
type TextSearchColumn = 'titulo' | 'autor';

// Busca los IDs de libros por título o autor.
const findBookIdsByText = async (
  text: string,
  columns: TextSearchColumn[]
): Promise<number[]> => {
  const pattern = `%${escapeLikePattern(text.trim())}%`;

  const conditions = columns.map(
    (column) =>
      Prisma.sql`
        lower(public.f_unaccent(${Prisma.raw(column)}))
        LIKE lower(public.f_unaccent(${pattern}))
      `
  );

  const rows = await prisma.$queryRaw<{ libro_id: number }[]>`
    SELECT libro_id
    FROM libro
    WHERE ${Prisma.join(conditions, ' OR ')}
  `;

  return rows.map((row) => row.libro_id);
};

// Construir filtros combinados.
const construirWhere = async ({
  query,
  titulo,
  autor,
  genero,
  nivel_educativo,
}: BuscarLibrosFiltros): Promise<Prisma.libroWhereInput> => {
  const where: Prisma.libroWhereInput = {};
  const idFilters: number[][] = [];

  // Búsqueda general por título o autor.
  if (query?.trim()) {
    idFilters.push(
      await findBookIdsByText(query, ['titulo', 'autor'])
    );
  }

  // Búsqueda específica por título.
  if (titulo?.trim()) {
    idFilters.push(
      await findBookIdsByText(titulo, ['titulo'])
    );
  }

  // Búsqueda específica por autor.
  if (autor?.trim()) {
    idFilters.push(
      await findBookIdsByText(autor, ['autor'])
    );
  }

  // Combinar los filtros de búsqueda.
  if (idFilters.length > 0) {
    where.AND = idFilters.map((ids) => ({
      libro_id: { in: ids },
    }));
  }

  // Filtros adicionales sin distinguir mayúsculas.
  if (genero) {
    where.genero = {
      equals: genero,
      mode: 'insensitive',
    };
  }

  if (nivel_educativo) {
    where.nivel_educativo = {
      equals: nivel_educativo,
      mode: 'insensitive',
    };
  }

  return where;
};

// Búsqueda paginada.
export const buscarLibrosPaginado = async (
  filtros: BuscarLibrosFiltros,
  pagination: PaginationParams
): Promise<Paginated<Libro>> => {
  try {
    const where = await construirWhere(filtros);

    const [data, total] = await prisma.$transaction([
      prisma.libro.findMany({
        where,
        orderBy: { libro_id: 'asc' },
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
