// src/routes/lista.routes.ts
import { Router } from 'express';
import ListaController from '../controllers/lista.controller.js';

const router = Router();

router.get('/', ListaController.obtenerTodas);
router.get('/:id', ListaController.obtenerPorId);
router.post('/', ListaController.crear);
router.put('/:id', ListaController.actualizar);
router.delete('/:id', ListaController.eliminar);

export default router;