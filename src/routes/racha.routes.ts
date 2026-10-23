// src/routes/racha.routes.ts
import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import RachaController from '../controllers/racha.controller';

const router = Router();

router.get('/me', verifyToken, RachaController.obtenerRacha);
router.post('/registrar', verifyToken, RachaController.registrarLectura);

export default router;
