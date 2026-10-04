// src/routes/foro.routes.ts
import { Router } from 'express';
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

const router = Router();

// Foros
router.post('/', moderateContent(['titulo', 'title', 'descripcion', 'description'], 'foro'), crearForo);
router.get('/', obtenerForos);
router.get('/:id', obtenerForo);
router.put('/:id', moderateContent(['titulo', 'title', 'descripcion', 'description'], 'foro'), actualizarForo);
router.delete('/:id', eliminarForo);

// Comentarios
router.get('/:id/comentarios', obtenerForoConComentarios);
router.post('/:id/comentarios', moderateContent(['contenido', 'content'], 'comentario_foro'), crearComentario);

export default router;