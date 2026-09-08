// src/services/list.service.ts
import { listaModel } from '../models/lista.model';

class ListService {
  async crearLista(nombre: string, descripcion: string, tipo: string) {
    return await listaModel.crearLista(nombre, descripcion, tipo);
  }

  async obtenerTodas() {
    return await listaModel.obtenerTodas();
  }

  async obtenerPorId(id: number) {
    return await listaModel.obtenerPorId(id);
  }

  async actualizarLista(id: number, nombre: string, descripcion: string, tipo: string) {
    return await listaModel.actualizarLista(id, nombre, descripcion, tipo);
  }

  async eliminarLista(id: number) {
    return await listaModel.eliminarLista(id);
  }
}

export const listService = new ListService();