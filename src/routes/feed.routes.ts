// src/routes/feed.routes.ts
import { Router } from 'express';
import { obtenerFeed, limpiarFeed } from '../controllers/feed.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', verifyToken, obtenerFeed);
router.delete('/', verifyToken, limpiarFeed);

export default router;