
// src/controllers/book.controller.ts
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { bookService } from '../services/book.service';
import { parsePagination } from '../utils/pagination';
import {
  getEnumParam,
  getPositiveIntParam,
  getStringParam,
  QueryParamError,
} from '../utils/queryParams';
import { MAX_SEARCH_LENGTH } from '../utils/search';
import { READING_STATUSES } from '../models/favorite.model';
import type { BuscarLibrosFiltros } from '../models/book.model';

const validarPaginas = (valor: unknown): boolean =>
  typeof valor === 'number' &&
  Number.isSafeInteger(valor) &&
  valor > 0 &&
  valor <= 2147483647;

// SAB-123: páginas opcionales; si se informan deben ser enteras positivas.
const validarPaginasOpcionales = (valor: unknown): boolean =>
  valor === null || validarPaginas(valor);

const tienePropiedad = (
  objeto: Record<string, unknown>,
  propiedad: string
): boolean => Object.prototype.hasOwnProperty.call(objeto, propiedad);

class BookController {
  async crear(req: Request, res: Response) {
    try {
      const body = req.body ?? {};
      const paginas = tienePropiedad(body, 'paginas_totales')
        ? body.paginas_totales
        : body.paginasTotales;

      const paginasNormalizadas = paginas === undefined ? null : paginas;

      if (!validarPaginasOpcionales(paginasNormalizadas)) {
        return res.status(400).json({
          mensaje: 'El número de páginas debe ser un entero mayor que cero, o dejarse vacío.',
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
      // getStringParam rechaza los parámetros repetidos (?query=a&query=b)
      const query = getStringParam(req.query, 'query');
      const titulo = getStringParam(req.query, 'titulo');
      const autor = getStringParam(req.query, 'autor');

      // SAB-060: año de cursada, curso y estado de lectura
      const anio = getPositiveIntParam(req.query, 'anio');
      const curso_id = getPositiveIntParam(req.query, 'curso_id');
      // Igual que en GET /users: sin anio_lectivo, el año se interpreta en el actual.
      // Con curso_id no hace falta: el curso ya pertenece a un año lectivo.
      const anio_lectivo =
        getPositiveIntParam(req.query, 'anio_lectivo') ??
        (anio && !curso_id ? new Date().getFullYear() : undefined);

      const filtros: BuscarLibrosFiltros = {
        query,
        titulo,
        autor,
        genero: getStringParam(req.query, 'genero'),
        nivel_educativo: getStringParam(req.query, 'nivel_educativo'),
        anio_lectivo,
        anio,
        curso_id,
        estado_lectura: getEnumParam(req.query, 'estado_lectura', READING_STATUSES),
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
      if (error instanceof QueryParamError) {
        return res.status(400).json({ mensaje: error.message });
      }
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
      const body = req.body ?? {};

      // SAB-123: campo ausente = conservar; null = quitar; número = actualizar.
      const tienePaginas =
        tienePropiedad(body, 'paginas_totales') ||
        tienePropiedad(body, 'paginasTotales');

      const paginas = tienePropiedad(body, 'paginas_totales')
        ? body.paginas_totales
        : body.paginasTotales;

      if (tienePaginas && !validarPaginasOpcionales(paginas)) {
        return res.status(400).json({
          mensaje: 'El número de páginas debe ser un entero mayor que cero, o dejarse vacío.',
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
