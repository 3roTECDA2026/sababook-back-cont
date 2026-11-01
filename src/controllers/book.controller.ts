
// src/controllers/book.controller.ts
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { bookService } from '../services/book.service';
import { parsePagination } from '../utils/pagination';

// SAB-123: las páginas son opcionales.
// Si se informa una cantidad, debe ser un entero positivo.
const validarPaginas = (valor: unknown): boolean =>
  typeof valor === 'number' &&
  Number.isSafeInteger(valor) &&
  valor > 0 &&
  valor <= 2147483647;

// Permite NULL, pero rechaza valores inválidos.
const validarPaginasOpcionales = (valor: unknown): boolean =>
  valor === null || validarPaginas(valor);

const tienePropiedad = (
  objeto: Record<string, unknown>,
  propiedad: string
): boolean =>
  Object.prototype.hasOwnProperty.call(objeto, propiedad);

class BookController {
  async crear(req: Request, res: Response) {
    try {
      const body = req.body ?? {};

      const paginas = tienePropiedad(body, 'paginas_totales')
        ? body.paginas_totales
        : body.paginasTotales;

      // Si no se informan páginas, guardar NULL.
      const paginasNormalizadas =
        paginas === undefined ? null : paginas;

      if (!validarPaginasOpcionales(paginasNormalizadas)) {
        return res.status(400).json({
          mensaje:
            'El número de páginas debe ser un entero mayor que cero o NULL',
        });
      }

      const nuevoLibro = await bookService.crearLibro({
        ...body,
        paginas_totales: paginasNormalizadas,
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
      const { query, genero, nivel_educativo } = req.query as {
        query?: string;
        genero?: string;
        nivel_educativo?: string;
      };

      const filtros = { query, genero, nivel_educativo };
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
      const body = req.body ?? {};

      // SAB-123: permitir actualizar otros campos sin enviar páginas.
      const tienePaginas =
        tienePropiedad(body, 'paginas_totales') ||
        tienePropiedad(body, 'paginasTotales');

      const paginas = tienePropiedad(body, 'paginas_totales')
        ? body.paginas_totales
        : body.paginasTotales;

      // Si se envían páginas, aceptar NULL o entero positivo.
      // Si no se envían, conservar el valor existente.
      if (tienePaginas && !validarPaginasOpcionales(paginas)) {
        return res.status(400).json({
          mensaje:
            'El número de páginas debe ser un entero mayor que cero o NULL',
        });
      }

      await bookService.actualizarLibro(id, {
        ...body,
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
            mensaje: 'Libro no encontrado',
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
