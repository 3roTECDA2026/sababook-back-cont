
import { Router } from 'express';
import { TipoRol } from '@prisma/client';

import {
  obtenerRecomendaciones,
  crearRecomendacion,
  eliminarRecomendacion,
} from '../controllers/recomendacion.controller';

import {
  verifyToken,
  requireRole,
} from '../middleware/auth.middleware';

const router = Router();

// Consultar recomendaciones (todos los usuarios)
router.get('/', obtenerRecomendaciones);

// Recomendar libro (administrador y docente)
router.post(
  '/:libroId',
  verifyToken,
  requireRole(TipoRol.ADMINISTRADOR, TipoRol.DOCENTE),
  crearRecomendacion
);

// Quitar recomendación (administrador y docente)
router.delete(
  '/:libroId',
  verifyToken,
  requireRole(TipoRol.ADMINISTRADOR, TipoRol.DOCENTE),
  eliminarRecomendacion
);

export default router;
