// src/controllers/favorite.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { favoriteModel } from '../models/favorite.model';

class FavoriteController {
  //  GET: Obtener todos los favoritos (opcional, para testing o admin)
  async getAll(req: AuthRequest, res: Response) {
    try {
      const favorites = await favoriteModel.getAllFavorites();
      res.status(200).json(favorites);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error getting favorites:', message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  //  POST: Crear un nuevo favorito
  async create(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.userId; // viene del token (middleware verifyToken)
      const { libro_id } = req.body;

      if (!usuario_id || !libro_id) {
        return res.status(400).json({ error: 'Missing required fields: usuario_id or libro_id' });
      }

      const newFavorite = await favoriteModel.createFavorite({ usuario_id, libro_id });
      res.status(201).json({
        message: 'Favorite created successfully',
        favorite: newFavorite,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error creating favorite:', message);

      if (message.includes('duplicate key')) {
        return res.status(409).json({ error: 'This book is already in your favorites' });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET: Obtener favoritos del usuario autenticado
  async getByUser(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.userId;

      if (!usuario_id) {
        return res.status(400).json({ error: 'User ID missing in token' });
      }

      const favorites = await favoriteModel.getFavoritesByUser(usuario_id);
      res.status(200).json(favorites);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error getting user favorites:', message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // DELETE: Eliminar un favorito
  async delete(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.userId; // viene del token (middleware verifyToken)
      const libro_id = parseInt(String(req.body.libro_id));

      if (!usuario_id || isNaN(libro_id)) {
        return res.status(400).json({ error: 'Invalid or missing IDs' });
      }

      const result = await favoriteModel.deleteFavorite(usuario_id, libro_id);

      if (!result) {
        return res.status(404).json({ error: 'Favorite not found' });
      }

      return res.status(204).end();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error deleting favorite:', message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new FavoriteController();