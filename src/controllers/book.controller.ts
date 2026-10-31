
// src/controllers/book.controller.ts
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { bookService } from '../services/book.service';
import { parsePagination } from '../utils/pagination';

const MAX_SEARCH_LENGTH = 100;

const SEARCH_PARAMS = ['query', 'titulo', 'autor', 'genero', 'nivel_educativo'] as const;

const validarPaginas = (valor: unknown): boolean =>
  typeof valor === 'number' &&
  Number.isSafeInteger(valor) &&
  valor > 0 &&
  valor <= 2147483647;

class BookController {
  async crear(req: Request, res: Response) {
    try {
      const paginas = req.body?.paginas_totales ?? req.body?.paginasTotales;

      if (!validarPaginas(paginas)) {
        return res.status(400).json({
          mensaje: 'El número de páginas es obligatorio y debe ser un entero mayor que cero',
        });
      }

      const nuevoLibro = await bookService.crearLibro({
        ...req.body,
        paginas_totales: paginas,
      });

      return res.status(201).json({
        mensaje: 'Libro creado correctamente',
        libro: nuevoLibro,
      });
    } catch (error) {
      console.error('Error al crear libro:', error);
      return res.status(500).json({
        mensaje: 'Error al crear libro',
      });
    }
  }

  async obtenerCatalogo(req: Request, res: Response) {
    try {
      const libros = await bookService.obtenerTodos();
      return res.json(libros);
    } catch (error) {
      console.error('Error al obtener catálogo:', error);
      return res.status(500).json({
        mensaje: 'Error al obtener libros',
      });
    }
  }

  async verDetalle(req: Request, res: Response) {
    const id = parseInt(String(req.params.id), 10);

    try {
      const libro = await bookService.obtenerPorId(id);

      if (!libro) {
        return res.status(404).json({
          mensaje: 'Libro no encontrado',
        });
      }

      return res.json(libro);
    } catch (error) {
      console.error('Error al obtener detalle:', error);
      return res.status(500).json({
        mensaje: 'Error al obtener detalle del libro',
      });
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

      const filtros = {
        query,
        titulo,
        autor,
        genero,
        nivel_educativo,
      };

      if (
        [query, titulo, autor].some(
          (text) => text && text.length > MAX_SEARCH_LENGTH
        )
      ) {
        return res.status(400).json({
          mensaje: `La búsqueda no puede superar los ${MAX_SEARCH_LENGTH} caracteres.`,
        });
      }

      const pagination = parsePagination(req.query);

      if (pagination) {
        const resultado = await bookService.buscarLibrosPaginado(
          filtros,
          pagination
        );

        return res.json(resultado);
      }

      const libros = await bookService.buscarLibros(filtros);

      return res.json(libros);
    } catch (error) {
      console.error('Error al buscar libros:', error);
      return res.status(500).json({
        mensaje: 'Error al buscar libros',
      });
    }
  }

  async actualizar(req: Request, res: Response) {
    const id = parseInt(String(req.params.id), 10);

    try {
      // Si se envía el campo, debe contener un valor válido.
      // Las actualizaciones de otros campos siguen permitidas.
      const tienePaginas =
        Object.prototype.hasOwnProperty.call(
          req.body ?? {},
          'paginas_totales'
        ) ||
        Object.prototype.hasOwnProperty.call(
          req.body ?? {},
          'paginasTotales'
        );

      const paginas =
        req.body?.paginas_totales ?? req.body?.paginasTotales;

      if (tienePaginas && !validarPaginas(paginas)) {
        return res.status(400).json({
          mensaje: 'El número de páginas debe ser un entero mayor que cero',
        });
      }

      await bookService.actualizarLibro(id, {
        ...req.body,
        ...(tienePaginas ? { paginas_totales: paginas } : {}),
      });

      return res.json({
        mensaje: 'Libro actualizado correctamente',
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return res.status(404).json({
          mensaje: 'Libro no encontrado',
        });
      }

      console.error('Error al actualizar:', error);

      return res.status(500).json({
        mensaje: 'Error al actualizar libro',
      });
    }
  }

  async eliminar(req: Request, res: Response) {
    const id = parseInt(String(req.params.id), 10);

    try {
      const eliminado = await bookService.eliminarLibro(id);

      if (!eliminado) {
        return res.status(404).json({
          mensaje: 'Libro no encontrado para eliminar',
        });
      }

      return res.status(204).send();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          return res.status(409).json({
            mensaje:
              'No se puede eliminar el libro porque fue asignado a cursos y forma parte del historial.',
          });
        }

        if (error.code === 'P2025') {
          return res.status(404).json({
            mensaje: 'Libro no encontrado para eliminar',
          });
        }
      }

      console.error('Error al eliminar:', error);

      return res.status(500).json({
        mensaje: 'Error al eliminar libro y sus dependencias',
      });
    }
  }

  async eliminacionLogica(req: Request, res: Response) {
    const id = parseInt(String(req.params.id), 10);

    try {
      await bookService.eliminacionLogica(id);

      return res.json({
        mensaje: 'Libro marcado como inactivo',
      });
    } catch (error) {
      console.error('Error al marcar como inactivo:', error);

      return res.status(500).json({
        mensaje: 'Error al marcar libro como inactivo',
      });
    }
  }
}

export default new BookController();
