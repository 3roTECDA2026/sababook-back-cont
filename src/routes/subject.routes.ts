// src/routes/subject.routes.ts
import { Router } from 'express';
import {
  obtenerMaterias,
  obtenerMateria,
  crearMateria,
  actualizarMateria,
  eliminarMateria,
} from '../controllers/subject.controller';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', verifyToken, obtenerMaterias);
router.get('/:id', verifyToken, obtenerMateria);
router.post('/', verifyToken, requireAdmin, crearMateria);
router.put('/:id', verifyToken, requireAdmin, actualizarMateria);
router.delete('/:id', verifyToken, requireAdmin, eliminarMateria);

export default router;