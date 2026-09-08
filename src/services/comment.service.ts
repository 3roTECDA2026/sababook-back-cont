// src/services/comment.service.ts
import {
  insertarComentario,
  obtenerComentariosPorForo,
  obtenerTodosComentarios,
  obtenerComentarioPorId,
  actualizarComentarioPorId,
  eliminarComentarioPorId,
} from '../models/comment.model';
import { medalModel } from '../models/medal.model';
import { obtenerForoConComentariosDB } from '../models/foro.model';

class CommentService {
  async crearComentario(foroId: number, usuarioId: number, contenido: string) {
    const nuevoComentario = await insertarComentario(foroId, usuarioId, contenido);

    // Asignar medallas si aplica
    await medalModel.verificarYAsignarMedallas(usuarioId);

    // Obtener el comentario completo desde la DB
    const foroConComentarios = await obtenerForoConComentariosDB(foroId);
    const comentarioCompleto = foroConComentarios?.comentarios.find(
      (c) => c.comentario_id === nuevoComentario.comentario_id
    );

    return comentarioCompleto;
  }

  async obtenerComentarios(foroId?: number) {
    if (foroId) {
      return await obtenerComentariosPorForo(foroId);
    }
    return await obtenerTodosComentarios();
  }

  async obtenerComentarioPorId(id: number) {
    return await obtenerComentarioPorId(id);
  }

  async actualizarComentario(id: number, contenido: string) {
    return await actualizarComentarioPorId(id, contenido);
  }

  async eliminarComentario(id: number) {
    return await eliminarComentarioPorId(id);
  }
}

export const commentService = new CommentService();