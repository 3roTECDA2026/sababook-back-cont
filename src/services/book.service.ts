// src/services/book.service.ts
import {
  obtenerTodos,
  obtenerPorId,
  buscarLibros,
  actualizarLibro,
  eliminarLibro,
  crearLibro,
  eliminacionLogica as eliminacionLogicaModel,
  buscarLibrosPaginado,
} from '../models/book.model';
import { PaginationParams } from '../utils/pagination';
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

  async buscarLibrosPaginado(
  filters: { query?: string; genero?: string; nivel_educativo?: string },
  pagination: PaginationParams
) {
  return await buscarLibrosPaginado(filters, pagination);
}
}

export const bookService = new BookService();