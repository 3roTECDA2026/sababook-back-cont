// src/routes/comentario.routes.ts
import { Router } from 'express';
import {
  crearComentario,
  obtenerComentarios,
  obtenerComentario,
  actualizarComentario,
  eliminarComentario,
} from '../controllers/comment.controller';
import { verifyToken, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/', verifyToken, crearComentario);
router.get('/:foro_id', optionalAuth, obtenerComentarios);
router.get('/:id', optionalAuth, obtenerComentario);
router.put('/:id', verifyToken, actualizarComentario);
router.delete('/:id', verifyToken, eliminarComentario);

router.post('/:id/comentarios', verifyToken, crearComentario);

export default router;