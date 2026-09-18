// src/routes/comentario.routes.ts
import { Router } from 'express';
import {
  crearComentario,
  obtenerComentarios,
  obtenerComentario,
  actualizarComentario,
  eliminarComentario,
} from '../controllers/comentario.controller';

const router = Router();

router.post('/', crearComentario);
router.get('/:foro_id', obtenerComentarios);
router.get('/:id', obtenerComentario);
router.put('/:id', actualizarComentario);
router.delete('/:id', eliminarComentario);

router.post('/:id/comentarios', crearComentario);

export default router;