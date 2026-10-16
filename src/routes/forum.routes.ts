// src/routes/foro.routes.ts
import { Router } from 'express';
import { TipoRol } from '@prisma/client';
import {
  crearForo,
  obtenerForos,
  obtenerForo,
  actualizarForo,
  eliminarForo,
  obtenerForoConComentarios,
} from '../controllers/forum.controller';
import { crearComentario } from '../controllers/comment.controller';
import { moderateContent } from '../modules/moderation/middleware/moderate-content';
import { verifyToken, optionalAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Foros
router.post(
  '/',
  verifyToken,
  requireRole(TipoRol.DOCENTE, TipoRol.ADMINISTRADOR),
  moderateContent(['titulo', 'descripcion'], 'foro'),
  crearForo
);
router.get('/', optionalAuth, obtenerForos);
router.get('/:id', optionalAuth, obtenerForo);
router.put(
  '/:id',
  verifyToken,
  moderateContent(['titulo', 'descripcion'], 'foro'),
  actualizarForo
);
router.delete('/:id', verifyToken, eliminarForo);

// Comentarios
router.get('/:id/comentarios', optionalAuth, obtenerForoConComentarios);
router.post(
  '/:id/comentarios',
  verifyToken,
  moderateContent(['contenido'], 'comentario_foro'),
  crearComentario
);
router.post(
  '/:id/comments',
  verifyToken,
  moderateContent(['contenido', 'content'], 'comentario_foro'),
  crearComentario
);

export default router;