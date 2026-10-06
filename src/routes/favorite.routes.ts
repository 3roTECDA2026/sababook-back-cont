// src/routes/favorite.routes.ts
import { Router } from 'express';
import favoriteController from '../controllers/favorite.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/', verifyToken, favoriteController.create);
router.get('/', verifyToken, favoriteController.getByUser);
router.get('/statuses', verifyToken, favoriteController.getReadingStatuses);
router.patch('/status', verifyToken, favoriteController.updateReadingStatus);
router.delete('/', verifyToken, favoriteController.delete);

router.get('/all', verifyToken, favoriteController.getAll);

export default router;