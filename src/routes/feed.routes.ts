// src/routes/feed.routes.ts
import { Router } from 'express';
import { obtenerFeed, limpiarFeed } from '../controllers/feed.controller';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', verifyToken, obtenerFeed);

// Vaciar el muro borra las publicaciones de toda la escuela: solo el administrador (SAB-097)
router.delete('/', verifyToken, requireAdmin, limpiarFeed);

export default router;