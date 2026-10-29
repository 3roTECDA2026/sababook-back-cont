
import { Response } from 'express';
import { Prisma } from '@prisma/client';

import { AuthRequest } from '../middleware/auth.middleware';
import { favoriteService } from '../services/favorite.service';

import {
  ReadingStatus,
  ReadingProgressError,
} from '../models/favorite.model';

const READING_STATUSES: ReadingStatus[] = [
  'general',
  'quiero-leer',
  'leyendo',
  'leido',
];

class FavoriteController {
  // ==========================================
  // OBTENER TODOS LOS FAVORITOS
  // ==========================================

  async getAll(req: AuthRequest, res: Response) {
    try {
      const favorites = await favoriteService.getAllFavorites();

      return res.status(200).json(favorites);
    } catch (error) {
      console.error('Error getting favorites:', error);

      return res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // ==========================================
  // CREAR FAVORITO
  // ==========================================

  async create(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.userId;
      const { libro_id } = req.body;

      if (!usuario_id || !libro_id) {
        return res.status(400).json({
          error: 'Missing required fields: usuario_id or libro_id',
        });
      }

      const newFavorite = await favoriteService.createFavorite({
        usuario_id,
        libro_id,
      });

      return res.status(201).json({
        message: 'Favorite created successfully',
        favorite: newFavorite,
      });
    } catch (error) {
      console.error('Error creating favorite:', error);

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return res.status(409).json({
          error: 'This book is already in your favorites',
        });
      }

      return res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // ==========================================
  // OBTENER FAVORITOS DEL USUARIO
  // ==========================================

  async getByUser(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.userId;

      if (!usuario_id) {
        return res.status(401).json({
          error: 'Usuario no autenticado',
        });
      }

      const favorites =
        await favoriteService.getFavoritesByUser(usuario_id);

      return res.status(200).json(favorites);
    } catch (error) {
      console.error('Error getting user favorites:', error);

      return res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // ==========================================
  // SAB-059: OBTENER ESTADOS DE LECTURA
  // ==========================================

  async getReadingStatuses(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.userId;

      if (!usuario_id) {
        return res.status(401).json({
          error: 'Usuario no autenticado',
        });
      }

      const statuses =
        await favoriteService.getReadingStatusesByUser(usuario_id);

      return res.status(200).json(statuses);
    } catch (error) {
      console.error('Error getting reading statuses:', error);

      return res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // ==========================================
  // SAB-059: ACTUALIZAR ESTADO DE LECTURA
  // ==========================================

  async updateReadingStatus(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.userId;
      const libro_id = Number(req.body?.libro_id);
      const estado_lectura = req.body?.estado_lectura as ReadingStatus;

      if (!usuario_id) {
        return res.status(401).json({
          error: 'Usuario no autenticado',
        });
      }

      if (
        !Number.isInteger(libro_id) ||
        libro_id <= 0 ||
        !READING_STATUSES.includes(estado_lectura)
      ) {
        return res.status(400).json({
          error: 'ID de libro o estado de lectura inválido',
        });
      }

      const updated =
        await favoriteService.updateReadingStatus(
          usuario_id,
          libro_id,
          estado_lectura
        );

      return res.status(200).json(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        return res.status(404).json({
          error: 'Libro no encontrado',
        });
      }

      console.error('Error updating reading status:', error);

      return res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // ==========================================
  // CONTADOR DE LIBROS LEÍDOS
  // GET /api/v1/favorites/read-count
  // ==========================================

  async countReadBooks(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.userId;

      if (!usuario_id) {
        return res.status(401).json({
          error: 'Usuario no autenticado',
        });
      }

      const result =
        await favoriteService.countReadBooks(usuario_id);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error counting read books:', error);

      return res.status(500).json({
        error: 'Error interno al contar los libros leídos',
      });
    }
  }

  // ==========================================
  // SAB-91: CONSULTAR PROGRESO INDIVIDUAL
  // GET /api/v1/favorites/progress?libro_id=18
  // ==========================================

  async getReadingProgress(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.userId;

      if (!usuario_id) {
        return res.status(401).json({
          error: 'Usuario no autenticado',
        });
      }

      const libro_id = Number(req.query.libro_id);

      if (
        !Number.isInteger(libro_id) ||
        libro_id <= 0
      ) {
        return res.status(400).json({
          error: 'El ID del libro debe ser un entero positivo',
        });
      }

      const progress =
        await favoriteService.getReadingProgress(
          usuario_id,
          libro_id
        );

      return res.status(200).json(progress);
    } catch (error) {
      if (error instanceof ReadingProgressError) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }

      console.error('Error getting reading progress:', error);

      return res.status(500).json({
        error: 'Error interno al consultar el progreso de lectura',
      });
    }
  }

  // ==========================================
  // SAB-91: ACTUALIZAR PROGRESO INDIVIDUAL
  // PATCH /api/v1/favorites/progress
  // ==========================================

  async updateReadingProgress(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.userId;

      if (!usuario_id) {
        return res.status(401).json({
          error: 'Usuario no autenticado',
        });
      }

      const libro_id = Number(req.body?.libro_id);
      const pagina_actual = req.body?.pagina_actual;

      if (
        !Number.isInteger(libro_id) ||
        libro_id <= 0
      ) {
        return res.status(400).json({
          error: 'El ID del libro debe ser un entero positivo',
        });
      }

      if (
        typeof pagina_actual !== 'number' ||
        !Number.isInteger(pagina_actual) ||
        pagina_actual < 0
      ) {
        return res.status(400).json({
          error: 'La página actual debe ser un entero mayor o igual a 0',
        });
      }

      const progress =
        await favoriteService.updateReadingProgress(
          usuario_id,
          libro_id,
          pagina_actual
        );

      return res.status(200).json({
        message: 'Progreso de lectura actualizado correctamente',
        ...progress,
      });
    } catch (error) {
      if (error instanceof ReadingProgressError) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        return res.status(404).json({
          error: 'Libro o usuario no encontrado',
        });
      }

      console.error('Error updating reading progress:', error);

      return res.status(500).json({
        error: 'Error interno al actualizar el progreso de lectura',
      });
    }
  }

  // ==========================================
  // ELIMINAR FAVORITO
  // ==========================================

  async delete(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.userId;
      const libro_id = Number(req.body?.libro_id);

      if (!usuario_id) {
        return res.status(401).json({
          error: 'Usuario no autenticado',
        });
      }

      if (
        !Number.isInteger(libro_id) ||
        libro_id <= 0
      ) {
        return res.status(400).json({
          error: 'ID del libro inválido',
        });
      }

      const result =
        await favoriteService.deleteFavorite(
          usuario_id,
          libro_id
        );

      if (!result) {
        return res.status(404).json({
          error: 'Favorite not found',
        });
      }

      return res.status(204).end();
    } catch (error) {
      console.error('Error deleting favorite:', error);

      return res.status(500).json({
        error: 'Internal server error',
      });
    }
  }
}

export default new FavoriteController();
