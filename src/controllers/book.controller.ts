// src/controllers/book.controller.ts
import { Request, Response } from 'express';
import {
  obtenerTodos,
  obtenerPorId,
  buscarLibros,
  actualizarLibro,
  eliminarLibro, // Necesita ser mejorado en el modelo o aquí
  crearLibro,
  eliminacionLogica as eliminacionLogicaModel,
} from '../models/book.model.js';

class BookController {
  // NUEVA FUNCIÓN: CREAR LIBRO (Maneja el POST 404)
  async crear(req: Request, res: Response) {
    try {
      // Los datos del libro vienen en req.body
      const nuevoLibro = await crearLibro(req.body);
      // Éxito: 201 Created y retorna el nuevo libro
      res.status(201).json({
        mensaje: 'Libro creado correctamente',
        libro: nuevoLibro,
      });
    } catch (error) {
      console.error('Error al crear libro:', error);
      // Puede ser 400 Bad Request si los datos son inválidos, o 500 si es error de BD
      res.status(500).json({ mensaje: 'Error al crear libro' });
    }
  }

  async obtenerCatalogo(req: Request, res: Response) {
    try {
      const libros = await obtenerTodos();
      res.json(libros);
    } catch (error) {
      console.error('Error al obtener catálogo:', error);
      res.status(500).json({ mensaje: 'Error al obtener libros' });
    }
  }

  async verDetalle(req: Request, res: Response) {
    const id = parseInt(String(req.params.id));
    try {
      const libro = await obtenerPorId(id);
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
      const libros = await buscarLibros(req.query as { query?: string; genero?: string; nivel_educativo?: string });
      res.json(libros);
    } catch (error) {
      console.error('Error al buscar libros:', error);
      res.status(500).json({ mensaje: 'Error al buscar libros' });
    }
  }

  async actualizar(req: Request, res: Response) {
    const id = parseInt(String(req.params.id));
    try {
      await actualizarLibro(id, req.body);
      res.json({ mensaje: 'Libro actualizado correctamente' });
    } catch (error) {
      console.error('Error al actualizar:', error);
      res.status(500).json({ mensaje: 'Error al actualizar libro' });
    }
  }

  // FUNCIÓN MEJORADA: ELIMINAR LIBRO (Maneja el DELETE 500)
  // Nota: Esta lógica debería ir en el modelo, pero la implementamos aquí para arreglar el error de FK.
  async eliminar(req: Request, res: Response) {
    const id = parseInt(String(req.params.id));
    try {
      // 1. Manejar dependencias (Claves Foráneas - FK)
      // Si tu modelo tiene funciones para eliminar opiniones, debes usarlas aquí.
      // Si usas ON DELETE CASCADE en la BD (opción recomendada), esta sección no es necesaria.
      // Suponemos que si no usas CASCADE, necesitas eliminar las opiniones primero.

      // await eliminarOpinionesPorLibro(id); // <--- Llama a una función del modelo de opinión/BD

      // 2. Eliminar el libro.
      const eliminado = await eliminarLibro(id); // Asumiendo que retorna true si se eliminó

      if (!eliminado) {
        return res.status(404).json({ mensaje: 'Libro no encontrado para eliminar' });
      }

      // Estándar HTTP: 204 No Content para eliminación exitosa sin cuerpo de respuesta.
      res.status(204).send();
    } catch (error) {
      console.error('Error al eliminar:', error);
      res.status(500).json({ mensaje: 'Error al eliminar libro y sus dependencias' });
    }
  }

  async eliminacionLogica(req: Request, res: Response) {
    const id = parseInt(String(req.params.id));
    try {
      await eliminacionLogicaModel(id);
      res.json({ mensaje: 'Libro marcado como inactivo' });
    } catch (error) {
      console.error('Error al marcar como inactivo:', error);
      res.status(500).json({ mensaje: 'Error al marcar libro como inactivo' });
    }
  }
}

export default new BookController();