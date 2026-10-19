
import { Router } from 'express';
import RecomendacionController from '../controllers/recomendacion.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// Consulta pública para mostrar recomendaciones en el inicio
router.get(
  '/',
  RecomendacionController.obtenerTodas
);

// Crear recomendación: requiere autenticación
router.post(
  '/:libroId',
  verifyToken,
  RecomendacionController.crear
);

// Eliminar recomendación: requiere autenticación
router.delete(
  '/:libroId',
  verifyToken,
  RecomendacionController.eliminar
);

export default router;
