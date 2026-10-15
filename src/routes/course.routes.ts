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
} from '../controllers/course.controller';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Cursos: solo el administrador crea, edita o elimina
router.get('/', verifyToken, obtenerCursos);
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

export default router;