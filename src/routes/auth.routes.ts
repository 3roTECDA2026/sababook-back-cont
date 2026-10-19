// src/routes/auth.routes.ts
import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { requireAdmin, verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', authController.login);
router.post('/register', verifyToken, requireAdmin, authController.register);

export default router;