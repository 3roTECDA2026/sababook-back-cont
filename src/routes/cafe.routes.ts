// src/routes/cafe.routes.ts
import { Router } from 'express';
import { TipoRol } from '@prisma/client';
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
router.post('/', verifyToken, requireRole(TipoRol.DOCENTE, TipoRol.ADMINISTRADOR), crearCafe);
router.get('/', optionalAuth, obtenerCafes);
router.get('/:id', optionalAuth, obtenerCafe);
router.put('/:id', verifyToken, requireRole(TipoRol.DOCENTE, TipoRol.ADMINISTRADOR), actualizarCafe);
router.delete('/:id', verifyToken, requireRole(TipoRol.DOCENTE, TipoRol.ADMINISTRADOR), eliminarCafe);

// Rutas de Asistencia (RSVP)
router.post('/:id/asistencia', verifyToken, toggleAsistencia);
router.get('/:id/asistentes', verifyToken, requireRole(TipoRol.DOCENTE, TipoRol.ADMINISTRADOR), obtenerAsistentes);

// Ruta de Votación Post-Lectura ("¿Te gustó el libro?")
router.post('/:id/voto', verifyToken, votarCafe);

export default router;