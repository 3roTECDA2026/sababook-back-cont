// src/models/course.model.ts
import { prisma } from '../db/connect/db';
import { AccionAsignacion } from '@prisma/client';
import type { Prisma, curso, curso_docente, curso_libro, TipoRol } from '@prisma/client';

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

export interface FiltrosHistorial {
  anio_lectivo?: number;
  curso_id?: number;
  libro_id?: number;
  docente_id?: number;
}

export interface RegistroHistorial {
  historial_id: number;
  accion: AccionAsignacion;
  puntaje: number | null;
  fecha: Date;
  anio_lectivo: number;
  curso: { curso_id: number; anio: number; division: string };
  libro: { libro_id: number; titulo: string; autor: string };
  usuario: { usuario_id: number; nombre: string } | null;
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
): Promise<{ rol: TipoRol } | null> => {
  return await prisma.usuario.findUnique({
    where: { usuario_id },
    select: { rol: true },
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

// ---------- Historial de asignaciones ----------

// Registra un movimiento en el historial, dentro de la misma transacción que el cambio
const registrarHistorial = async (
  tx: Prisma.TransactionClient,
  datos: {
    curso_id: number;
    libro_id: number;
    accion: AccionAsignacion;
    puntaje: number | null;
    usuario_id?: number;
  }
): Promise<void> => {
  const cursoActual = await tx.curso.findUniqueOrThrow({
    where: { curso_id: datos.curso_id },
    select: { anio_lectivo: true },
  });

  await tx.historial_asignacion.create({
    data: {
      curso_id: datos.curso_id,
      libro_id: datos.libro_id,
      usuario_id: datos.usuario_id ?? null,
      anio_lectivo: cursoActual.anio_lectivo,
      accion: datos.accion,
      puntaje: datos.puntaje,
    },
  });
};

export const obtenerHistorialDB = async (
  filtros: FiltrosHistorial
): Promise<RegistroHistorial[]> => {
  const registros = await prisma.historial_asignacion.findMany({
    where: {
      anio_lectivo: filtros.anio_lectivo,
      curso_id: filtros.curso_id,
      libro_id: filtros.libro_id,
      // Si viene docente_id, solo los cursos donde ese usuario es docente
      curso: filtros.docente_id
        ? { curso_docente: { some: { usuario_id: filtros.docente_id } } }
        : undefined,
    },
    include: {
      curso: { select: { curso_id: true, anio: true, division: true } },
      libro: { select: { libro_id: true, titulo: true, autor: true } },
      usuario: { select: { usuario_id: true, nombre: true } },
    },
    orderBy: { fecha: 'desc' },
  });

  return registros.map((r) => ({
    historial_id: r.historial_id,
    accion: r.accion,
    puntaje: r.puntaje,
    fecha: r.fecha,
    anio_lectivo: r.anio_lectivo,
    curso: r.curso,
    libro: r.libro,
    usuario: r.usuario,
  }));
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

// Cada cambio en los libros del curso se guarda junto con su registro en el historial:
// si una de las dos operaciones falla, no se aplica ninguna

export const asignarLibroDB = async (
  curso_id: number,
  libro_id: number,
  puntaje: number,
  usuario_id?: number
): Promise<curso_libro> => {
  return await prisma.$transaction(async (tx) => {
    const asignacion = await tx.curso_libro.create({ data: { curso_id, libro_id, puntaje } });
    await registrarHistorial(tx, {
      curso_id,
      libro_id,
      accion: AccionAsignacion.ASIGNADO,
      puntaje,
      usuario_id,
    });
    return asignacion;
  });
};

export const actualizarPuntajeLibroDB = async (
  curso_id: number,
  libro_id: number,
  puntaje: number,
  usuario_id?: number
): Promise<curso_libro> => {
  return await prisma.$transaction(async (tx) => {
    const asignacion = await tx.curso_libro.update({
      where: { curso_id_libro_id: { curso_id, libro_id } },
      data: { puntaje },
    });
    await registrarHistorial(tx, {
      curso_id,
      libro_id,
      accion: AccionAsignacion.PUNTAJE_ACTUALIZADO,
      puntaje,
      usuario_id,
    });
    return asignacion;
  });
};

export const quitarLibroDB = async (
  curso_id: number,
  libro_id: number,
  usuario_id?: number
): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    const quitada = await tx.curso_libro.delete({
      where: { curso_id_libro_id: { curso_id, libro_id } },
    });
    await registrarHistorial(tx, {
      curso_id,
      libro_id,
      accion: AccionAsignacion.QUITADO,
      puntaje: quitada.puntaje,
      usuario_id,
    });
  });
};

// ---------- creditos / progreso ----------

// Criterio 2: lee el mínimo anual desde configuracion_sistema (140 por defecto si no está cargado)
export const obtenerPuntajeMinimoAnualDB = async (): Promise<number> => {
  const config = await prisma.configuracion_sistema.findUnique({
    where: { clave: 'puntaje_minimo_anual' },
  });
  const valor = config ? Number(config.valor) : NaN;
  return Number.isFinite(valor) && valor > 0 ? valor : 140;
};

export interface ProgresoAlumno {
  anio_lectivo: number;
  curso: { curso_id: number; anio: number; division: string } | null;
  puntaje_acumulado: number;
  minimo_requerido: number;
  faltante: number;
  cumplido: boolean;
}

// Criterio 3: progreso de un alumno en un año lectivo.
// Suma el puntaje de los libros que el alumno marcó como "leido" Y que están asignados a su curso de ese año.
export const obtenerProgresoAlumnoDB = async (
  alumno_id: number,
  anio_lectivo: number,
  minimo: number
): Promise<ProgresoAlumno> => {
  // 1. Curso del alumno en ese año lectivo
  const inscripcion = await prisma.inscripcion.findUnique({
    where: { usuario_id_anio_lectivo: { usuario_id: alumno_id, anio_lectivo } },
    include: { curso: { select: { curso_id: true, anio: true, division: true } } },
  });

  if (!inscripcion) {
    return {
      anio_lectivo,
      curso: null,
      puntaje_acumulado: 0,
      minimo_requerido: minimo,
      faltante: minimo,
      cumplido: false,
    };
  }

  // 2. Libros asignados al curso (con su puntaje)
  const asignados = await prisma.curso_libro.findMany({
    where: { curso_id: inscripcion.curso_id },
    select: { libro_id: true, puntaje: true },
  });

  // 3. Libros que el alumno marcó como leídos
  const leidos = await prisma.favorito.findMany({
    where: { usuario_id: alumno_id, estado_lectura: 'leido' },
    select: { libro_id: true },
  });
  const leidosIds = new Set(leidos.map((f) => f.libro_id));

  // 4. Suma del puntaje de los libros asignados Y leídos
  const puntaje_acumulado = asignados
    .filter((a) => leidosIds.has(a.libro_id))
    .reduce((suma, a) => suma + a.puntaje, 0);

  return {
    anio_lectivo,
    curso: inscripcion.curso,
    puntaje_acumulado,
    minimo_requerido: minimo,
    faltante: Math.max(0, minimo - puntaje_acumulado),
    cumplido: puntaje_acumulado >= minimo,
  };
};