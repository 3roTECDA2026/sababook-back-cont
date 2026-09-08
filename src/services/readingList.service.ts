// src/services/readingList.service.ts
import { listaLecturaModel } from '../models/listaLectura.model';

class ReadingListService {
  async crearListaLectura(
    lista_id: number,
    docente_id: number,
    descripcion: string,
    nivel: string
  ) {
    return await listaLecturaModel.crearListaLectura(lista_id, docente_id, descripcion, nivel);
  }

  async obtenerTodas() {
    return await listaLecturaModel.obtenerTodas();
  }

  async obtenerPorDocente(docente_id: number) {
    return await listaLecturaModel.obtenerPorDocente(docente_id);
  }

  async actualizarListaLectura(
    lista_id: number,
    docente_id: number,
    descripcion?: string,
    nivel?: string
  ) {
    return await listaLecturaModel.actualizarListaLectura(lista_id, docente_id, descripcion, nivel);
  }

  async eliminarListaLectura(lista_id: number, docente_id: number) {
    return await listaLecturaModel.eliminarListaLectura(lista_id, docente_id);
  }
}

export const readingListService = new ReadingListService();