// src/routes/cafe.routes.ts
import { Router } from 'express';
import {
  crearCafe,
  obtenerCafes,
  obtenerCafe,
  actualizarCafe,
  eliminarCafe,
  toggleAsistencia,
  obtenerAsistentes,
  votarCafe,
} from '../controllers/cafe.controller';
import { verifyToken, optionalAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Rutas de Cafés Literarios
router.post('/', verifyToken, requireRole('DOCENTE', 'ADMINISTRADOR', 'docente', 'admin'), crearCafe);
router.get('/', optionalAuth, obtenerCafes);
router.get('/:id', optionalAuth, obtenerCafe);
router.put('/:id', verifyToken, requireRole('DOCENTE', 'ADMINISTRADOR', 'docente', 'admin'), actualizarCafe);
router.delete('/:id', verifyToken, requireRole('DOCENTE', 'ADMINISTRADOR', 'docente', 'admin'), eliminarCafe);

// Rutas de Asistencia (RSVP)
router.post('/:id/asistencia', verifyToken, toggleAsistencia);
router.get('/:id/asistentes', verifyToken, requireRole('DOCENTE', 'ADMINISTRADOR', 'docente', 'admin'), obtenerAsistentes);

// Ruta de Votación Post-Lectura ("¿Te gustó el libro?")
router.post('/:id/voto', verifyToken, votarCafe);

export default router;