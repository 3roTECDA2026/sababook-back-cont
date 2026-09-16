// src/routes/metaLectura.routes.ts
import { Router } from 'express';
import metaLecturaController from '../controllers/metaLectura.controller';
import { verifyToken } from '../middleware/auth.middleware'; // Ajustá según el nombre de tu middleware

const router = Router();

// Aplicar autenticación si usás middleware de JWT
router.post('/', verifyToken, metaLecturaController.crear);
router.get('/usuario/:usuarioId', verifyToken, metaLecturaController.obtenerMisMetas);
router.delete('/:id', verifyToken, metaLecturaController.eliminar);

export default router;