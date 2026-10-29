import { prisma } from '../db/connect/db';
import { TipoRol } from '@prisma/client';

export interface CursoPanel {
  curso_id: number;
  anio: number;
  division: string;
  anio_lectivo: number;
  materia: string;
}

export interface FavoritoAlumno {
  usuario_id: number;
  alumno: string;
  curso_id: number;
  libro_id: number;
  titulo: string;
  autor: string;
  genero: string | null;
  portada_url: string | null;
  estado_lectura: string;
  es_favorito: boolean;
  fecha_estado: Date;
}

// Cursos visibles en el panel: el docente ve los suyos; el administrador, todos
export const obtenerCursosDelPanelDB = async (
  usuario_id: number,
  rol: TipoRol
): Promise<CursoPanel[]> => {
  const cursos = await prisma.curso.findMany({
    where:
      rol === TipoRol.ADMINISTRADOR ? undefined : { curso_docente: { some: { usuario_id } } },
    include: { materia: { select: { nombre: true } } },
    orderBy: [{ anio_lectivo: 'desc' }, { anio: 'asc' }, { division: 'asc' }],
  });

  return cursos.map((c) => ({
    curso_id: c.curso_id,
    anio: c.anio,
    division: c.division,
    anio_lectivo: c.anio_lectivo,
    materia: c.materia.nombre,
  }));
};

// Favoritos de los alumnos inscriptos en los cursos indicados
export const obtenerFavoritosDeAlumnosDB = async (
  curso_ids: number[]
): Promise<{ cantidad_alumnos: number; favoritos: FavoritoAlumno[] }> => {
  const inscripciones = await prisma.inscripcion.findMany({
    where: { curso_id: { in: curso_ids } },
    orderBy: { anio_lectivo: 'desc' },
    select: {
      curso_id: true,
      usuario: {
        select: {
          usuario_id: true,
          nombre: true,
          favorito: {
            select: {
              estado_lectura: true,
              es_favorito: true,
              fecha_estado: true,
              libro: {
                select: { libro_id: true, titulo: true, autor: true, genero: true, portada_url: true },
              },
            },
          },
        },
      },
    },
  });

  // Un alumno puede estar inscripto en cursos de distintos años lectivos:
  // se cuenta una sola vez, en su curso más reciente
  const vistos = new Set<number>();
  const favoritos: FavoritoAlumno[] = [];

  for (const { curso_id, usuario } of inscripciones) {
    if (vistos.has(usuario.usuario_id)) continue;
    vistos.add(usuario.usuario_id);

    for (const f of usuario.favorito) {
      favoritos.push({
        usuario_id: usuario.usuario_id,
        alumno: usuario.nombre,
        curso_id,
        ...f.libro,
        estado_lectura: f.estado_lectura,
        es_favorito: f.es_favorito,
        fecha_estado: f.fecha_estado,
      });
    }
  }

  return { cantidad_alumnos: vistos.size, favoritos };
};

// IDs de los libros asignados a los cursos indicados
export const obtenerLibrosAsignadosDB = async (curso_ids: number[]): Promise<number[]> => {
  const filas = await prisma.curso_libro.findMany({
    where: { curso_id: { in: curso_ids } },
    select: { libro_id: true },
    distinct: ['libro_id'],
  });
  return filas.map((f) => f.libro_id);
};

