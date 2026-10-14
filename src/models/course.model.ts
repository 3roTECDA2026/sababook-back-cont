// src/models/course.model.ts
import { prisma } from '../db/connect/db';
import type { curso, curso_docente, curso_libro } from '@prisma/client';

export interface DatosCurso {
  anio: number;
  division: string;
  anio_lectivo: number;
  materia_id: number;
}

export interface FiltrosCursos {
  anio_lectivo?: number;
  materia_id?: number;
  docente_id?: number;
}
export interface MateriaCurso {
  materia_id: number;
  nombre: string;
}

export interface CursoResumen {
  curso_id: number;
  anio: number;
  division: string;
  anio_lectivo: number;
  materia: MateriaCurso;
  cantidad_docentes: number;
  cantidad_libros: number;
}

export interface DocenteCurso {
  usuario_id: number;
  nombre: string;
  email: string;
}

export interface LibroCurso {
  libro_id: number;
  titulo: string;
  autor: string;
  portada_url: string | null;
  puntaje: number;
}

export interface CursoDetalle {
  curso_id: number;
  anio: number;
  division: string;
  anio_lectivo: number;
  materia: MateriaCurso;
  docentes: DocenteCurso[];
  libros: LibroCurso[];
}

// ---------- Cursos ----------

export const obtenerCursosDB = async (filtros: FiltrosCursos): Promise<CursoResumen[]> => {
  const cursos = await prisma.curso.findMany({
    where: {
      anio_lectivo: filtros.anio_lectivo,
      materia_id: filtros.materia_id,
      curso_docente: filtros.docente_id
        ? { some: { usuario_id: filtros.docente_id } }
        : undefined,
    },
    include: {
      materia: { select: { materia_id: true, nombre: true } },
      _count: { select: { curso_docente: true, curso_libro: true } },
    },
    orderBy: [{ anio_lectivo: 'desc' }, { anio: 'asc' }, { division: 'asc' }],
  });

  return cursos.map((c) => ({
    curso_id: c.curso_id,
    anio: c.anio,
    division: c.division,
    anio_lectivo: c.anio_lectivo,
    materia: c.materia,
    cantidad_docentes: c._count.curso_docente,
    cantidad_libros: c._count.curso_libro,
  }));
};


export const obtenerCursoPorIdDB = async (curso_id: number): Promise<CursoDetalle | null> => {
  const c = await prisma.curso.findUnique({
    where: { curso_id },
    include: {
      materia: { select: { materia_id: true, nombre: true } },
      curso_docente: {
        include: { usuario: { select: { usuario_id: true, nombre: true, email: true } } },
      },
      curso_libro: {
        include: {
          libro: { select: { libro_id: true, titulo: true, autor: true, portada_url: true } },
        },
      },
    },
  });

  if (!c) return null;

  return {
    curso_id: c.curso_id,
    anio: c.anio,
    division: c.division,
    anio_lectivo: c.anio_lectivo,
    materia: c.materia,
    docentes: c.curso_docente.map((cd) => cd.usuario),
    libros: c.curso_libro.map((cl) => ({ ...cl.libro, puntaje: cl.puntaje })),
  };
};

export const existeCursoDB = async (curso_id: number): Promise<boolean> => {
  const cantidad = await prisma.curso.count({ where: { curso_id } });
  return cantidad > 0;
};

export const crearCursoDB = async (datos: DatosCurso): Promise<curso> => {
  return await prisma.curso.create({ data: datos });
};

export const actualizarCursoDB = async (
  curso_id: number,
  datos: Partial<DatosCurso>
): Promise<curso> => {
  return await prisma.curso.update({ where: { curso_id }, data: datos });
};

export const eliminarCursoDB = async (curso_id: number): Promise<void> => {
  await prisma.curso.delete({ where: { curso_id } });
};

// ---------- Docentes del curso ----------

export const obtenerRolUsuarioDB = async (
  usuario_id: number
): Promise<{ rol_id: number | null } | null> => {
  return await prisma.usuario.findUnique({
    where: { usuario_id },
    select: { rol_id: true },
  });
};

export const asignarDocenteDB = async (
  curso_id: number,
  usuario_id: number
): Promise<curso_docente> => {
  return await prisma.curso_docente.create({ data: { curso_id, usuario_id } });
};

export const quitarDocenteDB = async (curso_id: number, usuario_id: number): Promise<void> => {
  await prisma.curso_docente.delete({
    where: { curso_id_usuario_id: { curso_id, usuario_id } },
  });
};

export const esDocenteDelCursoDB = async (curso_id: number, usuario_id: number): Promise<boolean> => {
  const cantidad = await prisma.curso_docente.count({ where: { curso_id, usuario_id } });
  return cantidad > 0;
};

// ---------- Libros del curso ----------

export const obtenerLibrosDelCursoDB = async (curso_id: number): Promise<LibroCurso[]> => {
  const filas = await prisma.curso_libro.findMany({
    where: { curso_id },
    include: {
      libro: { select: { libro_id: true, titulo: true, autor: true, portada_url: true } },
    },
    orderBy: { libro: { titulo: 'asc' } },
  });

  return filas.map((f) => ({ ...f.libro, puntaje: f.puntaje }));
};

export const asignarLibroDB = async (
  curso_id: number,
  libro_id: number,
  puntaje: number
): Promise<curso_libro> => {
  return await prisma.curso_libro.create({ data: { curso_id, libro_id, puntaje } });
};

export const actualizarPuntajeLibroDB = async (
  curso_id: number,
  libro_id: number,
  puntaje: number
): Promise<curso_libro> => {
  return await prisma.curso_libro.update({
    where: { curso_id_libro_id: { curso_id, libro_id } },
    data: { puntaje },
  });
};

export const quitarLibroDB = async (curso_id: number, libro_id: number): Promise<void> => {
  await prisma.curso_libro.delete({
    where: { curso_id_libro_id: { curso_id, libro_id } },
  });
};