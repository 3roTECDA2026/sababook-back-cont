// src/services/forum.service.ts
import {
  obtenerForoConComentariosDB,
  crearForoDB,
  obtenerTodosForosDB,
  obtenerForoPorIdDB,
  actualizarForoDB,
  eliminarForoDB,
} from '../models/foro.model';

class ForumService {
  async crearForo(titulo: string, descripcion: string, creadorId: number) {
    return await crearForoDB(titulo, descripcion, creadorId);
  }

  async obtenerTodosForos() {
    return await obtenerTodosForosDB();
  }

  async obtenerForoPorId(id: number) {
    return await obtenerForoPorIdDB(id);
  }

  async actualizarForo(id: number, titulo: string, descripcion: string) {
    return await actualizarForoDB(id, titulo, descripcion);
  }

  async eliminarForo(id: number) {
    return await eliminarForoDB(id);
  }

  async obtenerForoConComentarios(id: number) {
    return await obtenerForoConComentariosDB(id);
  }
}

export const forumService = new ForumService();