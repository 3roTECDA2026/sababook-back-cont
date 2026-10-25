
import { Router } from 'express';

import favoriteController from '../controllers/favorite.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// ==========================================
// FAVORITOS
// ==========================================

router.post(
  '/',
  verifyToken,
  favoriteController.create
);

router.get(
  '/',
  verifyToken,
  favoriteController.getByUser
);

// ==========================================
// SAB-059: ESTADOS DE LECTURA
// ==========================================

router.get(
  '/statuses',
  verifyToken,
  favoriteController.getReadingStatuses
);

router.patch(
  '/status',
  verifyToken,
  favoriteController.updateReadingStatus
);

// ==========================================
// CONTADOR DE LIBROS LEÍDOS
// ==========================================

router.get(
  '/read-count',
  verifyToken,
  favoriteController.countReadBooks
);

// ==========================================
// SAB-91: PROGRESO INDIVIDUAL
// ==========================================

router.get(
  '/progress',
  verifyToken,
  favoriteController.getReadingProgress
);

router.patch(
  '/progress',
  verifyToken,
  favoriteController.updateReadingProgress
);

// ==========================================
// ELIMINAR FAVORITO
// ==========================================

router.delete(
  '/',
  verifyToken,
  favoriteController.delete
);

// ==========================================
// OBTENER TODOS
// ==========================================

router.get(
  '/all',
  verifyToken,
  favoriteController.getAll
);

export default router;
