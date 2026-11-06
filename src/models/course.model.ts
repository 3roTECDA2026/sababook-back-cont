// src/models/course.model.ts
import { prisma } from '../db/connect/db';
import { AccionAsignacion } from '@prisma/client';
import type { Prisma, curso, curso_docente, curso_libro, inscripcion, TipoRol } from '@prisma/client';

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
  alumno_id?: number;
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
  puntaje_anual: number;
  materia: MateriaCurso;
  cantidad_docentes: number;
  cantidad_libros: number;
  // SAB-117: cada curso tiene un solo docente (null si todavía no tiene)
  docente: DocenteCurso | null;
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
  pdf_path: string | null;
  puntaje: number | null;
}

export interface CursoDetalle {
  curso_id: number;
  anio: number;
  division: string;
  anio_lectivo: number;
  puntaje_anual: number;
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
      // SAB-116: cursos en los que está inscripto un alumno
      inscripcion: filtros.alumno_id
        ? { some: { usuario_id: filtros.alumno_id } }
        : undefined,
    },
    include: {
      materia: { select: { materia_id: true, nombre: true } },
      curso_docente: {
        include: { usuario: { select: { usuario_id: true, nombre: true, email: true } } },
      },
      _count: { select: { curso_docente: true, curso_libro: true } },
    },
    orderBy: [{ anio_lectivo: 'desc' }, { anio: 'asc' }, { division: 'asc' }],
  });

  return cursos.map((c) => ({
    curso_id: c.curso_id,
    anio: c.anio,
    division: c.division,
    anio_lectivo: c.anio_lectivo,
    puntaje_anual: c.puntaje_anual,
    materia: c.materia,
    cantidad_docentes: c._count.curso_docente,
    cantidad_libros: c._count.curso_libro,
    docente: c.curso_docente[0]?.usuario ?? null,
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
          libro: { select: { libro_id: true, titulo: true, autor: true, portada_url: true, pdf_path: true } },
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
    puntaje_anual: c.puntaje_anual,
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

// Docente actual del curso (como máximo uno, por el índice único de SAB-117)
export const findCourseTeacherDB = async (curso_id: number): Promise<DocenteCurso | null> => {
  const asignacion = await prisma.curso_docente.findUnique({
    where: { curso_id },
    include: { usuario: { select: { usuario_id: true, nombre: true, email: true } } },
  });
  return asignacion?.usuario ?? null;
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

// ---------- Alumnos del curso (SAB-116) ----------

export const obtenerAnioLectivoCursoDB = async (curso_id: number): Promise<number | null> => {
  const c = await prisma.curso.findUnique({ where: { curso_id }, select: { anio_lectivo: true } });
  return c?.anio_lectivo ?? null;
};

export const obtenerPuntajeAnualCursoDB = async (curso_id: number): Promise<number | null> => {
  const c = await prisma.curso.findUnique({ where: { curso_id }, select: { puntaje_anual: true } });
  return c?.puntaje_anual ?? null;
};

// Inscripción del alumno en un año lectivo (como máximo una, por el índice único de inscripcion)
export const findStudentEnrollmentDB = async (usuario_id: number, anio_lectivo: number) => {
  return await prisma.inscripcion.findUnique({
    where: { usuario_id_anio_lectivo: { usuario_id, anio_lectivo } },
    include: { curso: { select: { curso_id: true, anio: true, division: true } } },
  });
};

export const inscribirAlumnoDB = async (
  curso_id: number,
  usuario_id: number,
  anio_lectivo: number
): Promise<inscripcion> => {
  return await prisma.inscripcion.create({ data: { curso_id, usuario_id, anio_lectivo } });
};
// Inscribe al alumno en el curso, o lo pasa a ese curso si ya tenía otro en el año.
// Es una sola operación en la base: el alumno nunca queda sin curso a mitad de camino.
export const moverAlumnoDB = async (
  curso_id: number,
  usuario_id: number,
  anio_lectivo: number
): Promise<inscripcion> => {
  return await prisma.inscripcion.upsert({
    where: { usuario_id_anio_lectivo: { usuario_id, anio_lectivo } },
    update: { curso_id, fecha_inscripcion: new Date() },
    create: { curso_id, usuario_id, anio_lectivo },
  });
};
// Devuelve cuántas inscripciones borró (0 si el alumno no estaba en ese curso)
export const quitarAlumnoDB = async (curso_id: number, usuario_id: number): Promise<number> => {
  const { count } = await prisma.inscripcion.deleteMany({ where: { curso_id, usuario_id } });
  return count;
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
      libro: { select: { libro_id: true, titulo: true, autor: true, portada_url: true, pdf_path: true } },
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
  puntaje: number | null,
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
  puntaje: number | null,
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

export const PUNTAJE_ANUAL_POR_DEFECTO = 140;

export const actualizarPuntajeAnualDB = async (
  curso_id: number,
  puntaje_anual: number
): Promise<curso> => {
  return await prisma.curso.update({
    where: { curso_id },
    data: { puntaje_anual },
  });
};

export interface ProgresoAlumno {
  anio_lectivo: number;
  curso: { curso_id: number; anio: number; division: string } | null;
  puntaje_acumulado: number;
  minimo_requerido: number;
  faltante: number;
  cumplido: boolean;
}

export interface PuntajeAlumno {
  usuario_id: number;
  nombre: string;
  puntaje_acumulado: number;
  minimo_requerido: number;
  faltante: number;
  cumplido: boolean;
}

export interface CursoPuntajes {
  curso: {
    curso_id: number;
    anio: number;
    division: string;
    anio_lectivo: number;
    puntaje_anual: number;
  };
  alumnos: PuntajeAlumno[];
}

export const obtenerProgresoAlumnoDB = async (
  alumno_id: number,
  anio_lectivo: number
): Promise<ProgresoAlumno> => {
  const inscripcion = await prisma.inscripcion.findUnique({
    where: { usuario_id_anio_lectivo: { usuario_id: alumno_id, anio_lectivo } },
    include: {
      curso: {
        select: { curso_id: true, anio: true, division: true, puntaje_anual: true },
      },
    },
  });

  if (!inscripcion) {
    return {
      anio_lectivo,
      curso: null,
      puntaje_acumulado: 0,
      minimo_requerido: PUNTAJE_ANUAL_POR_DEFECTO,
      faltante: PUNTAJE_ANUAL_POR_DEFECTO,
      cumplido: false,
    };
  }

  const { puntaje_anual, ...curso } = inscripcion.curso;
  const minimo = puntaje_anual;

  const asignados = await prisma.curso_libro.findMany({
    where: { curso_id: inscripcion.curso_id },
    select: { libro_id: true, puntaje: true },
  });

  const leidos = await prisma.favorito.findMany({
    where: { usuario_id: alumno_id, estado_lectura: 'leido' },
    select: { libro_id: true },
  });
  const leidosIds = new Set(leidos.map((f) => f.libro_id));

  const puntaje_acumulado = Math.min(
    asignados
      .filter((a) => a.puntaje !== null && leidosIds.has(a.libro_id))
      .reduce((suma, a) => suma + (a.puntaje ?? 0), 0),
    minimo
  );

  return {
    anio_lectivo,
    curso,
    puntaje_acumulado,
    minimo_requerido: minimo,
    faltante: Math.max(0, minimo - puntaje_acumulado),
    cumplido: puntaje_acumulado >= minimo,
  };
};

export const obtenerPuntajesCursoDB = async (
  curso_id: number
): Promise<CursoPuntajes | null> => {
  const curso = await prisma.curso.findUnique({
    where: { curso_id },
    select: {
      curso_id: true,
      anio: true,
      division: true,
      anio_lectivo: true,
      puntaje_anual: true,
    },
  });

  if (!curso) return null;

  const [libros, inscripciones] = await Promise.all([
    prisma.curso_libro.findMany({
      where: { curso_id },
      select: { libro_id: true, puntaje: true },
    }),
    prisma.inscripcion.findMany({
      where: { curso_id },
      select: {
        usuario: {
          select: {
            usuario_id: true,
            nombre: true,
            favorito: { select: { libro_id: true, estado_lectura: true } },
          },
        },
      },
    }),
  ]);

  const puntajePorLibro = new Map(libros.map((l) => [l.libro_id, l.puntaje]));
  const minimo = curso.puntaje_anual;

  const alumnos = inscripciones
    .map(({ usuario }) => {
      const puntaje_acumulado = Math.min(
        usuario.favorito
          .filter((f) => f.estado_lectura === 'leido')
          .reduce((suma, f) => {
            const puntaje = puntajePorLibro.get(f.libro_id);
            return puntaje == null ? suma : suma + puntaje;
          }, 0),
        minimo
      );

      return {
        usuario_id: usuario.usuario_id,
        nombre: usuario.nombre,
        puntaje_acumulado,
        minimo_requerido: minimo,
        faltante: Math.max(0, minimo - puntaje_acumulado),
        cumplido: puntaje_acumulado >= minimo,
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  return { curso, alumnos };
};

// ---------- Alerta de asignaciones en años anteriores ----------

export interface AsignacionAnterior {
  anio_lectivo: number;
  curso: { curso_id: number; anio: number; division: string };
}

export const obtenerAsignacionesAnterioresDB = async (
  curso_id: number,
  libro_id: number
): Promise<AsignacionAnterior[] | null> => {
  const cursoActual = await prisma.curso.findUnique({
    where: { curso_id },
    select: { anio_lectivo: true },
  });

  if (!cursoActual) return null;

  const registros = await prisma.historial_asignacion.findMany({
    where: {
      libro_id,
      accion: AccionAsignacion.ASIGNADO,
      anio_lectivo: { lt: cursoActual.anio_lectivo },
    },
    include: {
      curso: { select: { curso_id: true, anio: true, division: true } },
    },
    distinct: ['curso_id'],
    orderBy: [{ anio_lectivo: 'desc' }, { curso_id: 'asc' }],
  });

  return registros.map((r) => ({
    anio_lectivo: r.anio_lectivo,
    curso: r.curso,
  }));
};

// ---------- Alumnos del curso (SAB-135) ----------

export interface CourseStudent {
  usuario_id: number;
  nombre: string;
  email: string;
}

// Alumnos inscriptos en el curso, ordenados por nombre. Devuelve null si el curso no existe.
export const getCourseStudentsDB = async (curso_id: number): Promise<CourseStudent[] | null> => {
  if (!(await existeCursoDB(curso_id))) return null;

  const enrollments = await prisma.inscripcion.findMany({
    where: { curso_id },
    include: { usuario: { select: { usuario_id: true, nombre: true, email: true } } },
    orderBy: { usuario: { nombre: 'asc' } },
  });

  return enrollments.map((enrollment) => enrollment.usuario);
};
