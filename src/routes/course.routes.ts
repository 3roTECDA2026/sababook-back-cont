// src/routes/course.routes.ts
import { Router } from 'express';
import {
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
} from '../controllers/course.controller';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Cursos: solo el administrador crea, edita o elimina
router.get('/', verifyToken, obtenerCursos);

// Historial de asignaciones de libros (administrador y docente).
// Va antes de '/:id' para que "history" no se interprete como un ID.
router.get('/history', verifyToken, obtenerHistorial);
// Progreso de lectura de un alumno en un año lectivo (alumno: solo el suyo; docente/admin: cualquiera)
router.get('/students/:studentId/progress', verifyToken, obtenerProgresoAlumno);
router.get('/:id', verifyToken, obtenerCurso);
router.post('/', verifyToken, requireAdmin, crearCurso);
router.put('/:id', verifyToken, requireAdmin, actualizarCurso);
router.delete('/:id', verifyToken, requireAdmin, eliminarCurso);

// Docentes del curso: solo el administrador
router.post('/:id/teachers', verifyToken, requireAdmin, asignarDocente);
router.delete('/:id/teachers/:userId', verifyToken, requireAdmin, quitarDocente);

// Libros del curso: administrador o docente asignado al curso (lo valida el service)
router.get('/:id/books', verifyToken, obtenerLibrosDelCurso);
router.post('/:id/books', verifyToken, asignarLibro);
router.put('/:id/books/:bookId', verifyToken, actualizarPuntajeLibro);
router.delete('/:id/books/:bookId', verifyToken, quitarLibro);

// Asignaciones del libro en años anteriores, para la alerta al asignar (SAB-066)
router.get('/:id/books/:bookId/previous-assignments', verifyToken, obtenerAsignacionesAnteriores);

export default router;