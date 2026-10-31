
import { Router } from 'express';

import {
  crearEpisodio,
  obtenerTodosEpisodios,
  obtenerEpisodioPorId,
  obtenerProgramaActual,
  eliminarEpisodio,
  sincronizarProgramas,
} from '../controllers/radio.controller';

import { verifyToken, requireRole } from '../middleware/auth.middleware';
import { TipoRol } from '@prisma/client';

const router = Router();

// Obtener todos los episodios
router.get('/', obtenerTodosEpisodios);

// Obtener información del programa actual
// Debe estar antes de /:id
router.get('/actual', obtenerProgramaActual);

// Sincronizar programas (usuario autenticado)
router.post('/sincronizar', verifyToken, sincronizarProgramas);

// Obtener episodio por ID
router.get('/:id', obtenerEpisodioPorId);

// Crear episodio (Docente o Administrador)
router.post(
  '/',
  verifyToken,
  requireRole(TipoRol.DOCENTE, TipoRol.ADMINISTRADOR),
  crearEpisodio
);

// Eliminar episodio (Docente o Administrador)
router.delete(
  '/:id',
  verifyToken,
  requireRole(TipoRol.DOCENTE, TipoRol.ADMINISTRADOR),
  eliminarEpisodio
);

export default router;
