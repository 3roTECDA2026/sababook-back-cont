// src/routes/comentario.routes.ts
import { Router } from 'express';
import {
  crearComentario,
  obtenerComentarios,
  obtenerComentario,
  actualizarComentario,
  eliminarComentario,
} from '../controllers/comment.controller';
import { moderateContent } from '../modules/moderation/middleware/moderate-content';

const router = Router();

router.post('/', moderateContent(['contenido', 'content'], 'comentario_foro'), crearComentario);
router.get('/:foro_id', obtenerComentarios);
router.get('/:id', obtenerComentario);
router.put('/:id', moderateContent(['contenido', 'content'], 'comentario_foro'), actualizarComentario);
router.delete('/:id', eliminarComentario);

router.post('/:id/comentarios', moderateContent(['contenido', 'content'], 'comentario_foro'), crearComentario);

export default router;