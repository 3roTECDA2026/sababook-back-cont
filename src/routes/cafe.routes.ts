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

const router = Router();

// Rutas de Cafés Literarios
router.post('/', crearCafe);
router.get('/', obtenerCafes);
router.get('/:id', obtenerCafe);
router.put('/:id', actualizarCafe);
router.delete('/:id', eliminarCafe);

// Rutas de Asistencia (RSVP)
router.post('/:id/asistencia', toggleAsistencia);
router.get('/:id/asistentes', obtenerAsistentes);

// Ruta de Votación Post-Lectura ("¿Te gustó el libro?")
router.post('/:id/voto', votarCafe);

export default router;