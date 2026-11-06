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
  BuscarLibrosFiltros,
  getBookPdfPath,
  updateBookPdfPath,
} from '../models/book.model';
import { PaginationParams } from '../utils/pagination';
import { getSignedPdfUrl, isPdf, removePdf, uploadPdf } from '../utils/pdfStorage';
import { ErrorNegocio } from './course.service';

// SAB-67: el archivo viejo se borra después de actualizar la base. Si falla, queda
// un archivo sin usar en el bucket, pero el libro nunca apunta a un archivo inexistente.
const removePdfQuietly = async (path: string) => {
  try {
    await removePdf(path);
  } catch (error) {
    console.error(`No se pudo borrar el PDF ${path} del bucket:`, error);
  }
};

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

  async buscarLibros(filters: BuscarLibrosFiltros) {
    return await buscarLibros(filters);
  }

  async actualizarLibro(id: number, bookData: any) {
    return await actualizarLibro(id, bookData);
  }

  async eliminarLibro(id: number) {
    const pdfPath = await getBookPdfPath(id);
    const eliminado = await eliminarLibro(id);
    // SAB-67: si el libro tenía PDF, se borra también del bucket
    if (eliminado && pdfPath) await removePdfQuietly(pdfPath);
    return eliminado;
  }

  async eliminacionLogica(id: number) {
    return await eliminacionLogicaModel(id);
  }

  async buscarLibrosPaginado(filters: BuscarLibrosFiltros, pagination: PaginationParams) {
    return await buscarLibrosPaginado(filters, pagination);
  }

  // SAB-67: sube el PDF y reemplaza el anterior, si había
  async attachPdf(bookId: number, file: Buffer) {
    const previousPath = await getBookPdfPath(bookId);
    if (previousPath === undefined) {
      throw new ErrorNegocio(404, 'Libro no encontrado.');
    }
    if (!isPdf(file)) {
      throw new ErrorNegocio(400, 'El archivo no es un PDF válido.');
    }

    const newPath = await uploadPdf(bookId, file);
    let libro;
    try {
      libro = await updateBookPdfPath(bookId, newPath);
    } catch (error) {
      await removePdfQuietly(newPath);
      throw error;
    }

    if (previousPath) await removePdfQuietly(previousPath);
    return libro;
  }

  async removeBookPdf(bookId: number) {
    const pdfPath = await getBookPdfPath(bookId);
    if (pdfPath === undefined) {
      throw new ErrorNegocio(404, 'Libro no encontrado.');
    }
    if (pdfPath === null) {
      throw new ErrorNegocio(404, 'El libro no tiene material PDF.');
    }

    const libro = await updateBookPdfPath(bookId, null);
    await removePdfQuietly(pdfPath);
    return libro;
  }

  async getPdfUrl(bookId: number) {
    const pdfPath = await getBookPdfPath(bookId);
    if (pdfPath === undefined) {
      throw new ErrorNegocio(404, 'Libro no encontrado.');
    }
    if (pdfPath === null) {
      throw new ErrorNegocio(404, 'El libro no tiene material PDF.');
    }
    return getSignedPdfUrl(pdfPath);
  }
}

export const bookService = new BookService();