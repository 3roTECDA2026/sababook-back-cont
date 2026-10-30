// src/controllers/book.controller.ts
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { bookService } from '../services/book.service';
import { parsePagination } from '../utils/pagination';

const MAX_SEARCH_LENGTH = 100;

const SEARCH_PARAMS = ['query', 'titulo', 'autor', 'genero', 'nivel_educativo'] as const;

class BookController {
  async crear(req: Request, res: Response) {
    try {
      const nuevoLibro = await bookService.crearLibro(req.body);
      res.status(201).json({
        mensaje: 'Libro creado correctamente',
        libro: nuevoLibro,
      });
    } catch (error) {
      console.error('Error al crear libro:', error);
      res.status(500).json({ mensaje: 'Error al crear libro' });
    }
  }

  async obtenerCatalogo(req: Request, res: Response) {
    try {
      const libros = await bookService.obtenerTodos();
      res.json(libros);
    } catch (error) {
      console.error('Error al obtener catálogo:', error);
      res.status(500).json({ mensaje: 'Error al obtener libros' });
    }
  }

  async verDetalle(req: Request, res: Response) {
    const id = parseInt(String(req.params.id), 10);
    try {
      const libro = await bookService.obtenerPorId(id);
      if (!libro) {
        return res.status(404).json({ mensaje: 'Libro no encontrado' });
      }
      res.json(libro);
    } catch (error) {
      console.error('Error al obtener detalle:', error);
      res.status(500).json({ mensaje: 'Error al obtener detalle del libro' });
    }
  }

  async buscar(req: Request, res: Response) {
    try {
      // Express entrega un array si el parámetro se repite (?query=a&query=b)
      const hasInvalidParam = SEARCH_PARAMS.some(
        (key) => req.query[key] !== undefined && typeof req.query[key] !== 'string'
      );
      if (hasInvalidParam) {
        return res
          .status(400)
          .json({ mensaje: 'Cada parámetro de búsqueda debe enviarse una sola vez.' });
      }

      const { query, titulo, autor, genero, nivel_educativo } = req.query as {
        query?: string;
        titulo?: string;
        autor?: string;
        genero?: string;
        nivel_educativo?: string;
      };
      const filtros = { query, titulo, autor, genero, nivel_educativo };

      if ([query, titulo, autor].some((text) => text && text.length > MAX_SEARCH_LENGTH)) {
        return res
          .status(400)
          .json({ mensaje: `La búsqueda no puede superar los ${MAX_SEARCH_LENGTH} caracteres.` });
      }

      const pagination = parsePagination(req.query);
      if (pagination) {
        const resultado = await bookService.buscarLibrosPaginado(filtros, pagination);
        return res.json(resultado);
      }

      // Modo legacy: sin page/limit devuelve el array completo
      const libros = await bookService.buscarLibros(filtros);
      res.json(libros);
    } catch (error) {
      console.error('Error al buscar libros:', error);
      res.status(500).json({ mensaje: 'Error al buscar libros' });
    }
  }

  async actualizar(req: Request, res: Response) {
    const id = parseInt(String(req.params.id), 10);
    try {
      await bookService.actualizarLibro(id, req.body);
      res.json({ mensaje: 'Libro actualizado correctamente' });
    } catch (error) {
      console.error('Error al actualizar:', error);
      res.status(500).json({ mensaje: 'Error al actualizar libro' });
    }
  }

  async eliminar(req: Request, res: Response) {
    const id = parseInt(String(req.params.id), 10);
    try {
      const eliminado = await bookService.eliminarLibro(id);

      if (!eliminado) {
        return res.status(404).json({ mensaje: 'Libro no encontrado para eliminar' });
      }

      res.status(204).send();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2003: el libro está referenciado por asignaciones a cursos o por su historial
        if (error.code === 'P2003') {
          return res.status(409).json({
             mensaje:
              'No se puede eliminar el libro porque fue asignado a cursos y forma parte del historial.',
          });
        }
        // P2025: el libro no existe
        if (error.code === 'P2025') {
          return res.status(404).json({ mensaje: 'Libro no encontrado para eliminar' });
        }
      }
      console.error('Error al eliminar:', error);
      res.status(500).json({ mensaje: 'Error al eliminar libro y sus dependencias' });
    }
  }

  async eliminacionLogica(req: Request, res: Response) {
    const id = parseInt(String(req.params.id), 10);
    try {
      await bookService.eliminacionLogica(id);
      res.json({ mensaje: 'Libro marcado como inactivo' });
    } catch (error) {
      console.error('Error al marcar como inactivo:', error);
      res.status(500).json({ mensaje: 'Error al marcar libro como inactivo' });
    }
  }
}

export default new BookController();