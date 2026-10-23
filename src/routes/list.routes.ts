// src/routes/lista.routes.ts
import { Router } from 'express';
import ListaController from '../controllers/list.controller';
import { verifyToken, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, ListaController.obtenerTodas);
router.get('/:id', optionalAuth, ListaController.obtenerPorId);
router.post('/', verifyToken, ListaController.crear);
router.put('/:id', verifyToken, ListaController.actualizar);
router.delete('/:id', verifyToken, ListaController.eliminar);

export default router;