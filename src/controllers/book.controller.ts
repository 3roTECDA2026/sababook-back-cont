
// src/controllers/book.controller.ts
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { bookService } from '../services/book.service';
import { parsePagination } from '../utils/pagination';

const MAX_SEARCH_LENGTH = 100;

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

  /**
   * Cargar archivo PDF de lectura para libros (SAB-67)
   * Admite carga mediante archivo en base64 o URL directa.
   */
  async cargarPdf(req: Request, res: Response) {
    try {
      const { nombreArchivo, base64, url } = req.body;

      if (url && typeof url === 'string' && url.trim().length > 0) {
        const trimmedUrl = url.trim();
        const isValidUrl =
          trimmedUrl.startsWith('http://') ||
          trimmedUrl.startsWith('https://') ||
          trimmedUrl.startsWith('/uploads/pdfs/');
        if (!isValidUrl) {
          return res.status(400).json({
            mensaje: 'La URL debe ser http(s):// o una ruta /uploads/pdfs/',
          });
        }
        return res.status(200).json({
          url: trimmedUrl,
          mensaje: 'URL de material PDF validada correctamente',
        });
      }

      if (!base64 || typeof base64 !== 'string') {
        return res.status(400).json({
          mensaje: 'Se requiere el contenido del archivo en base64 o una URL válida',
        });
      }

      const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      const rawBase64 = matches ? matches[2] : base64;
      const buffer = Buffer.from(rawBase64, 'base64');

      // Validar magic bytes de PDF
      if (buffer.toString('utf8', 0, 5) !== '%PDF-') {
        return res.status(400).json({
          mensaje: 'El archivo no es un PDF válido',
        });
      }

      // Límite de 25MB para PDFs
      const MAX_SIZE = 25 * 1024 * 1024;
      if (buffer.length > MAX_SIZE) {
        return res.status(400).json({
          mensaje: 'El archivo excede el tamaño máximo permitido (25MB)',
        });
      }

      const uploadDir = path.join(process.cwd(), 'uploads', 'pdfs');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const safeName = (nombreArchivo || 'material_lectura')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/\.pdf$/i, '');
      const filename = `${Date.now()}-${safeName}.pdf`;
      const filePath = path.join(uploadDir, filename);

      fs.writeFileSync(filePath, buffer);

      const fileUrl = `/uploads/pdfs/${filename}`;
      const baseUrl = (process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
      const absoluteUrl = `${baseUrl}${fileUrl}`;
      return res.status(201).json({
        url: absoluteUrl,
        mensaje: 'Archivo PDF cargado correctamente',
      });
    } catch (error) {
      console.error('Error al procesar archivo PDF:', error);
      return res.status(500).json({ mensaje: 'Error al procesar el archivo PDF' });
    }
  }

  /**
   * Adjuntar material de lectura PDF a un libro existente (SAB-67)
   */
  async adjuntarPdf(req: Request, res: Response) {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ mensaje: 'ID de libro no válido' });
    }

    try {
      const { archivo_url, pdf_url, url } = req.body;
      const finalUrl = archivo_url || pdf_url || url;

      if (!finalUrl || typeof finalUrl !== 'string') {
        return res.status(400).json({ mensaje: 'Se requiere la URL o ruta del archivo PDF' });
      }

      const trimmed = finalUrl.trim();
      const isValid =
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('/uploads/pdfs/');
      if (!isValid) {
        return res.status(400).json({
          mensaje: 'La URL debe ser http(s):// o una ruta /uploads/pdfs/',
        });
      }

      const libroActualizado = await bookService.actualizarLibro(id, {
        archivo_url: trimmed,
      });

      return res.status(200).json({
        mensaje: 'Material de lectura PDF adjuntado correctamente al libro',
        libro: libroActualizado,
      });
    } catch (error) {
      console.error('Error al adjuntar PDF:', error);
      return res.status(500).json({ mensaje: 'Error al adjuntar material PDF al libro' });
    }
  }
}

export default new BookController();
