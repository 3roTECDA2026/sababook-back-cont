// src/models/book.model.ts
import { db } from '../db/connect/db.js';

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

// NUEVA FUNCIÓN: Crear libro (Para manejar el POST)
export const crearLibro = async (datos: CrearLibroData): Promise<Libro> => {
  const columnas = Object.keys(datos).join(', ');
  const valores = Object.values(datos);
  // Crea placeholders como $1, $2, $3, etc.
  const placeholders = valores.map((_, i) => `$${i + 1}`).join(', ');

  const query = `INSERT INTO libro (${columnas}) VALUES (${placeholders}) RETURNING *`;

  try {
    // db.one se usa para asegurar que se retorne exactamente una fila (el libro creado)
    const result = await db.one<Libro>(query, valores);
    return result;
  } catch (error) {
    console.error('Error al crear libro:', error);
    throw error;
  }
};

// Obtener todos los libros
export const obtenerTodos = async (): Promise<Libro[]> => {
  try {
    const result = await db.any<Libro>('SELECT * FROM libro');
    return result;
  } catch (error) {
    console.error('Error al obtener todos los libros:', error);
    throw error;
  }
};

// Obtener libro por ID
export const obtenerPorId = async (id: number): Promise<Libro | null> => {
  const result = await db.oneOrNone<Libro>('SELECT * FROM libro WHERE libro_id = $1', [id]);
  return result;
};

// Buscar libros con filtros
export const buscarLibros = async ({
  query,
  genero,
  nivel_educativo,
}: BuscarLibrosFiltros): Promise<Libro[]> => {
  const filtros: string[] = [];
  const valores: string[] = [];

  if (query) {
    filtros.push(`(titulo ILIKE $${filtros.length + 1} OR autor ILIKE $${filtros.length + 1})`);
    valores.push(`%${query}%`);
  }
  if (genero) {
    filtros.push(`genero = $${filtros.length + 1}`);
    valores.push(genero);
  }
  if (nivel_educativo) {
    filtros.push(`nivel_educativo = $${filtros.length + 1}`);
    valores.push(nivel_educativo);
  }

  const sql =
    filtros.length > 0
      ? `SELECT * FROM libro WHERE ${filtros.join(' AND ')}`
      : 'SELECT * FROM libro';

  const result = await db.any<Libro>(sql, valores);
  return result;
};

// Actualizar libro
export const actualizarLibro = async (id: number, datos: ActualizarLibroData): Promise<void> => {
  const campos: string[] = [];
  const valores: unknown[] = [];
  let i = 1;

  for (const [clave, valor] of Object.entries(datos)) {
    // Ignorar el ID si está presente en los datos
    if (clave !== 'libro_id') {
      campos.push(`${clave} = $${i}`);
      valores.push(valor);
      i++;
    }
  }

  valores.push(id);
  const query = `UPDATE libro SET ${campos.join(', ')} WHERE libro_id = $${i} RETURNING *`;
  await db.oneOrNone(query, valores);
};

// FUNCIÓN MEJORADA: Eliminar libro físicamente (Ahora usa Transacciones para Claves Foráneas)
export const eliminarLibro = async (id: number): Promise<boolean> => {
  try {
    // Usamos db.tx (transaction) para asegurar que ambas eliminaciones se completen o ninguna lo haga.
    const resultado = await db.tx(async (t) => {
      // 1. Eliminar opiniones asociadas (soluciona el error 500 de FK)
      // Nota: Si tienes otras tablas dependientes (e.g., 'favorito'), añade la eliminación aquí.
      await t.none('DELETE FROM opinion WHERE libro_id = $1', [id]);

      // 2. Eliminar el libro principal
      const res = await t.result('DELETE FROM libro WHERE libro_id = $1', [id]);
      return res;
    });

    // Retorna true si se eliminó al menos una fila (el libro)
    return resultado.rowCount > 0;
  } catch (error) {
    console.error('Error al eliminar libro y sus dependencias:', error);
    throw error;
  }
};

// Eliminación lógica
export const eliminacionLogica = async (id: number): Promise<void> => {
  await db.result('UPDATE libro SET activo = false WHERE libro_id = $1', [id]);
};