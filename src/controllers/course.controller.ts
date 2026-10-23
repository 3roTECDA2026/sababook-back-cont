// src/controllers/course.controller.ts
import { Response } from 'express';
import { Prisma, TipoRol } from '@prisma/client';
import { courseService, ErrorNegocio } from '../services/course.service';
import { AuthRequest } from '../middleware/auth.middleware';
import type { DatosCurso, FiltrosCursos, FiltrosHistorial } from '../models/course.model';

type MapaErrores = Record<string, { status: number; mensaje: string }>;

const CURSO_NO_ENCONTRADO = { status: 404, mensaje: 'Curso no encontrado.' };
const CURSO_DUPLICADO = {
  status: 409,
  mensaje: 'Ya existe un curso con ese año, división y año lectivo.',
};

// Responde según el tipo de error (de negocio o de Prisma). Devuelve false si no lo reconoce.
const responderError = (res: Response, error: unknown, mapa: MapaErrores = {}): boolean => {
  if (error instanceof ErrorNegocio) {
    res.status(error.status).json({ error: error.message });
    return true;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && mapa[error.code]) {
    const { status, mensaje } = mapa[error.code];
    res.status(status).json({ error: mensaje });
    return true;
  }
  return false;
};

// Convierte un valor en número entero, o null si no lo es
const parsearEntero = (valor: unknown): number | null => {
  if (valor === undefined || valor === null || valor === '') return null;
  const numero = Number(valor);
  return Number.isInteger(numero) ? numero : null;
};

// Convierte un valor en ID válido (entero positivo), o null
const parsearId = (valor: unknown): number | null => {
  const id = parsearEntero(valor);
  return id !== null && id > 0 ? id : null;
};

// Valida los datos de un curso. Con parcial = true (edición), los campos son opcionales.
const validarDatosCurso = (body: Record<string, unknown>, parcial: boolean) => {
  const datos: Partial<DatosCurso> = {};

  if (body.anio !== undefined) {
    const anio = parsearEntero(body.anio);
    if (anio === null || anio < 1 || anio > 7) {
      return { datos, error: 'El año debe ser un número entero entre 1 y 7.' };
    }
    datos.anio = anio;
  } else if (!parcial) {
    return { datos, error: 'El año es obligatorio.' };
  }

  if (body.division !== undefined) {
    if (
      typeof body.division !== 'string' ||
      body.division.trim() === '' ||
      body.division.trim().length > 5
    ) {
      return { datos, error: 'La división debe tener entre 1 y 5 caracteres.' };
    }
    datos.division = body.division.trim().toUpperCase();
  } else if (!parcial) {
    return { datos, error: 'La división es obligatoria.' };
  }

  if (body.anio_lectivo !== undefined) {
    const anioLectivo = parsearEntero(body.anio_lectivo);
    if (anioLectivo === null || anioLectivo < 2000 || anioLectivo > 2100) {
      return { datos, error: 'El año lectivo no es válido.' };
    }
    datos.anio_lectivo = anioLectivo;
  } else if (!parcial) {
    return { datos, error: 'El año lectivo es obligatorio.' };
  }

  if (body.materia_id !== undefined) {
    const materiaId = parsearId(body.materia_id);
    if (materiaId === null) {
      return { datos, error: 'La materia indicada no es válida.' };
    }
    datos.materia_id = materiaId;
  } else if (!parcial) {
    return { datos, error: 'La materia es obligatoria.' };
  }

  if (parcial && Object.keys(datos).length === 0) {
    return { datos, error: 'Hay que enviar al menos un campo para actualizar.' };
  }

  return { datos, error: null };
};

// Valida el puntaje (créditos) de un libro: entero entre 1 y 100
const validarPuntaje = (valor: unknown): number | null => {
  const puntaje = parsearEntero(valor);
  return puntaje !== null && puntaje >= 1 && puntaje <= 100 ? puntaje : null;
};

// ---------- Cursos ----------

export const obtenerCursos = async (req: AuthRequest, res: Response): Promise<void> => {
  const filtros: FiltrosCursos = {};

  if (req.query.anio_lectivo !== undefined) {
    const anioLectivo = parsearEntero(req.query.anio_lectivo);
    if (anioLectivo === null) {
      res.status(400).json({ error: 'El filtro anio_lectivo no es válido.' });
      return;
    }
    filtros.anio_lectivo = anioLectivo;
  }

  if (req.query.materia_id !== undefined) {
    const materiaId = parsearId(req.query.materia_id);
    if (materiaId === null) {
      res.status(400).json({ error: 'El filtro materia_id no es válido.' });
      return;
    }
    filtros.materia_id = materiaId;
  }

  // ?mine=true devuelve solo los cursos donde el usuario logueado es docente
  if (req.query.mine === 'true') {
    filtros.docente_id = req.userId;
  }

  try {
    const cursos = await courseService.obtenerTodos(filtros);
    res.status(200).json(cursos);
  } catch (error) {
    console.error('Error al obtener los cursos:', error);
    res.status(500).json({ error: 'Error interno al obtener los cursos.' });
  }
};

export const obtenerCurso = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parsearId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'El ID del curso no es válido.' });
    return;
  }

  try {
    const curso = await courseService.obtenerPorId(id);
    if (!curso) {
      res.status(404).json({ error: CURSO_NO_ENCONTRADO.mensaje });
      return;
    }
    res.status(200).json(curso);
  } catch (error) {
    console.error('Error al obtener el curso:', error);
    res.status(500).json({ error: 'Error interno al obtener el curso.' });
  }
};

export const crearCurso = async (req: AuthRequest, res: Response): Promise<void> => {
  const { datos, error } = validarDatosCurso(req.body ?? {}, false);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  try {
    const curso = await courseService.crear(datos as DatosCurso);
    res.status(201).json(curso);
  } catch (err) {
    if (
      responderError(res, err, {
        P2002: CURSO_DUPLICADO,
        P2003: { status: 400, mensaje: 'La materia indicada no existe.' },
      })
    ) {
      return;
    }
    console.error('Error al crear el curso:', err);
    res.status(500).json({ error: 'Error interno al crear el curso.' });
  }
};

export const actualizarCurso = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parsearId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'El ID del curso no es válido.' });
    return;
  }

  const { datos, error } = validarDatosCurso(req.body ?? {}, true);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  try {
    const curso = await courseService.actualizar(id, datos);
    res.status(200).json(curso);
  } catch (err) {
    if (
      responderError(res, err, {
        P2025: CURSO_NO_ENCONTRADO,
        P2002: CURSO_DUPLICADO,
        P2003: { status: 400, mensaje: 'La materia indicada no existe.' },
      })
    ) {
      return;
    }
    console.error('Error al actualizar el curso:', err);
    res.status(500).json({ error: 'Error interno al actualizar el curso.' });
  }
};

export const eliminarCurso = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parsearId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'El ID del curso no es válido.' });
    return;
  }

  try {
    await courseService.eliminar(id);
    res.status(200).json({ message: 'Curso eliminado correctamente.' });
  } catch (err) {
    if (
      responderError(res, err, {
        P2025: CURSO_NO_ENCONTRADO,
        P2003: {
          status: 409,
          mensaje:
            'No se puede eliminar el curso porque tiene docentes, libros, alumnos, trivias o historial de asignaciones asociados.',
        },
      })
    ) {
      return;
    }
    console.error('Error al eliminar el curso:', err);
    res.status(500).json({ error: 'Error interno al eliminar el curso.' });
  }
};

// ---------- Docentes del curso ----------

export const asignarDocente = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parsearId(req.params.id);
  const usuarioId = parsearId(req.body?.usuario_id);
  if (!id || !usuarioId) {
    res.status(400).json({ error: 'El ID del curso o del docente no es válido.' });
    return;
  }

  try {
    await courseService.asignarDocente(id, usuarioId);
    res.status(201).json({ message: 'Docente asignado correctamente.' });
  } catch (err) {
    if (
      responderError(res, err, {
        P2002: { status: 409, mensaje: 'El docente ya está asignado a este curso.' },
        P2003: CURSO_NO_ENCONTRADO,
      })
    ) {
      return;
    }
    console.error('Error al asignar el docente:', err);
    res.status(500).json({ error: 'Error interno al asignar el docente.' });
  }
};

export const quitarDocente = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parsearId(req.params.id);
  const usuarioId = parsearId(req.params.userId);
  if (!id || !usuarioId) {
    res.status(400).json({ error: 'El ID del curso o del docente no es válido.' });
    return;
  }

  try {
    await courseService.quitarDocente(id, usuarioId);
    res.status(200).json({ message: 'Docente quitado del curso correctamente.' });
  } catch (err) {
    if (
      responderError(res, err, {
        P2025: { status: 404, mensaje: 'El docente no está asignado a este curso.' },
      })
    ) {
      return;
    }
    console.error('Error al quitar el docente:', err);
    res.status(500).json({ error: 'Error interno al quitar el docente.' });
  }
};

// ---------- Libros del curso ----------

export const obtenerLibrosDelCurso = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parsearId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'El ID del curso no es válido.' });
    return;
  }

  try {
    const libros = await courseService.obtenerLibros(id);
    res.status(200).json(libros);
  } catch (err) {
    if (responderError(res, err)) return;
    console.error('Error al obtener los libros del curso:', err);
    res.status(500).json({ error: 'Error interno al obtener los libros del curso.' });
  }
};

export const asignarLibro = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parsearId(req.params.id);
  const libroId = parsearId(req.body?.libro_id);
  if (!id || !libroId) {
    res.status(400).json({ error: 'El ID del curso o del libro no es válido.' });
    return;
  }

  const puntaje = validarPuntaje(req.body?.puntaje);
  if (puntaje === null) {
    res.status(400).json({ error: 'El puntaje debe ser un número entero entre 1 y 100.' });
    return;
  }

  try {
    const asignacion = await courseService.asignarLibro(id, libroId, puntaje, req.userId);
    res.status(201).json(asignacion);
  } catch (err) {
    if (
      responderError(res, err, {
        P2002: { status: 409, mensaje: 'El libro ya está asignado a este curso.' },
        P2003: { status: 404, mensaje: 'El curso o el libro no existen.' },
      })
    ) {
      return;
    }
    console.error('Error al asignar el libro:', err);
    res.status(500).json({ error: 'Error interno al asignar el libro.' });
  }
};

export const actualizarPuntajeLibro = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parsearId(req.params.id);
  const libroId = parsearId(req.params.bookId);
  if (!id || !libroId) {
    res.status(400).json({ error: 'El ID del curso o del libro no es válido.' });
    return;
  }

  const puntaje = validarPuntaje(req.body?.puntaje);
  if (puntaje === null) {
    res.status(400).json({ error: 'El puntaje debe ser un número entero entre 1 y 100.' });
    return;
  }

  try {
    const asignacion = await courseService.actualizarPuntajeLibro(id, libroId, puntaje, req.userId);
    res.status(200).json(asignacion);
  } catch (err) {
    if (
      responderError(res, err, {
        P2025: { status: 404, mensaje: 'El libro no está asignado a este curso.' },
      })
    ) {
      return;
    }
    console.error('Error al actualizar el puntaje:', err);
    res.status(500).json({ error: 'Error interno al actualizar el puntaje.' });
  }
};

export const quitarLibro = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parsearId(req.params.id);
  const libroId = parsearId(req.params.bookId);
  if (!id || !libroId) {
    res.status(400).json({ error: 'El ID del curso o del libro no es válido.' });
    return;
  }

  try {
    await courseService.quitarLibro(id, libroId, req.userId);
    res.status(200).json({ message: 'Libro quitado del curso correctamente.' });
  } catch (err) {
    if (
      responderError(res, err, {
        P2025: { status: 404, mensaje: 'El libro no está asignado a este curso.' },
      })
    ) {
      return;
    }
    console.error('Error al quitar el libro:', err);
    res.status(500).json({ error: 'Error interno al quitar el libro.' });
  }
};

// ---------- Historial de asignaciones ----------

export const obtenerHistorial = async (req: AuthRequest, res: Response): Promise<void> => {
  const filtros: FiltrosHistorial = {};

  if (req.query.anio_lectivo !== undefined) {
    const anioLectivo = parsearEntero(req.query.anio_lectivo);
    if (anioLectivo === null) {
      res.status(400).json({ error: 'El filtro anio_lectivo no es válido.' });
      return;
    }
    filtros.anio_lectivo = anioLectivo;
  }

  if (req.query.curso_id !== undefined) {
    const cursoId = parsearId(req.query.curso_id);
    if (cursoId === null) {
      res.status(400).json({ error: 'El filtro curso_id no es válido.' });
      return;
    }
    filtros.curso_id = cursoId;
  }

  if (req.query.libro_id !== undefined) {
    const libroId = parsearId(req.query.libro_id);
    if (libroId === null) {
      res.status(400).json({ error: 'El filtro libro_id no es válido.' });
      return;
    }
    filtros.libro_id = libroId;
  }

  try {
    const historial = await courseService.obtenerHistorial(filtros, req.userId);
    res.status(200).json(historial);
  } catch (err) {
    if (responderError(res, err)) return;
    console.error('Error al obtener el historial de asignaciones:', err);
    res.status(500).json({ error: 'Error interno al obtener el historial de asignaciones.' });
  }
};
// progreso del alumno (puntos acumulados vs mínimo anual) en un año lectivo
export const obtenerProgresoAlumno = async (req: AuthRequest, res: Response): Promise<void> => {
  const alumnoId = parsearId(req.params.studentId);
  const anioLectivo = parsearEntero(req.query.anio_lectivo);

  if (!alumnoId) {
    res.status(400).json({ error: 'El ID del alumno no es válido.' });
    return;
  }
  if (anioLectivo === null || anioLectivo < 2000) {
    res.status(400).json({ error: 'El año lectivo no es válido.' });
    return;
  }

  // Un alumno solo puede ver su propio progreso; docente y admin, el de cualquiera
  if (req.userRole === TipoRol.ALUMNO && alumnoId !== req.userId) {
    res.status(403).json({ error: 'Solo podés consultar tu propio progreso.' });
    return;
  }

  try {
    const progreso = await courseService.obtenerProgresoAlumno(alumnoId, anioLectivo);
    res.status(200).json(progreso);
  } catch (err) {
    console.error('Error al obtener el progreso del alumno:', err);
    res.status(500).json({ error: 'Error interno al obtener el progreso.' });
  }
};

// ---------- Alerta de asignaciones en años anteriores ----------

export const obtenerAsignacionesAnteriores = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = parsearId(req.params.id);
  const libroId = parsearId(req.params.bookId);
  if (!id || !libroId) {
    res.status(400).json({ error: 'El ID del curso o del libro no es válido.' });
    return;
  }

  try {
    const anteriores = await courseService.obtenerAsignacionesAnteriores(id, libroId, req.userId);
    res.status(200).json(anteriores);
  } catch (err) {
    if (responderError(res, err)) return;
    console.error('Error al obtener asignaciones anteriores:', err);
    res.status(500).json({ error: 'Error interno al obtener asignaciones anteriores.' });
  }
};
export default {
  obtenerCursos,
  obtenerCurso,
  crearCurso,
  actualizarCurso,
  eliminarCurso,
  asignarDocente,
  quitarDocente,
  obtenerLibrosDelCurso,
  asignarLibro,
  actualizarPuntajeLibro,
  quitarLibro,
  obtenerHistorial,
  obtenerProgresoAlumno,
  obtenerAsignacionesAnteriores,
};