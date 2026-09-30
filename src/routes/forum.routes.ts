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

const router = Router();

// Foros
router.post('/', crearForo);
router.get('/', obtenerForos);
router.get('/:id', obtenerForo);
router.put('/:id', actualizarForo);
router.delete('/:id', eliminarForo);

// Comentarios
router.get('/:id/comentarios', obtenerForoConComentarios);
router.post('/:id/comentarios', crearComentario); // <-- esta línea es la que faltaba

export default router;