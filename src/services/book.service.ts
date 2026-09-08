// src/services/book.service.ts
import {
  obtenerTodos,
  obtenerPorId,
  buscarLibros,
  actualizarLibro,
  eliminarLibro,
  crearLibro,
  eliminacionLogica as eliminacionLogicaModel,
} from '../models/book.model';

class BookService {
  async crearLibro(bookData: any) {
    return await crearLibro(bookData);
  }

  async obtenerTodos() {
    return await obtenerTodos();
  }

  async obtenerPorId(id: number) {
    return await obtenerPorId(id);
  }

  async buscarLibros(filters: { query?: string; genero?: string; nivel_educativo?: string }) {
    return await buscarLibros(filters);
  }

  async actualizarLibro(id: number, bookData: any) {
    return await actualizarLibro(id, bookData);
  }

  async eliminarLibro(id: number) {
    return await eliminarLibro(id);
  }

  async eliminacionLogica(id: number) {
    return await eliminacionLogicaModel(id);
  }
}

export const bookService = new BookService();