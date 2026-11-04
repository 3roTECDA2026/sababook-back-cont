// src/routes/lista.routes.ts
import { Router } from 'express';
import { TipoRol } from '@prisma/client';
import ListaController from '../controllers/list.controller';
import { verifyToken, optionalAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, ListaController.obtenerTodas);
router.get('/:id', optionalAuth, ListaController.obtenerPorId);
// SAB-134: Solo docentes y administradores pueden crear listas/itinerarios
router.post(
  '/',
  verifyToken,
  requireRole(TipoRol.DOCENTE, TipoRol.ADMINISTRADOR),
  ListaController.crear
);
router.put('/:id', verifyToken, ListaController.actualizar);
router.delete('/:id', verifyToken, ListaController.eliminar);

export default router;