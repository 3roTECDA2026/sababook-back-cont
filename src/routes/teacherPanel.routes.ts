import { Router } from 'express';
import { TipoRol } from '@prisma/client';
import { obtenerPanelDocente } from '../controllers/teacherPanel.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Panel de control: el docente ve sus cursos; el administrador, todos
router.get(
  '/',
  verifyToken,
  requireRole(TipoRol.DOCENTE, TipoRol.ADMINISTRADOR),
  obtenerPanelDocente
);

export default router;