// src/controllers/book.controller.ts
import { Request, Response } from 'express';
import { bookService } from '../services/book.service';

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
      const libros = await bookService.buscarLibros(
        req.query as { query?: string; genero?: string; nivel_educativo?: string }
      );
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