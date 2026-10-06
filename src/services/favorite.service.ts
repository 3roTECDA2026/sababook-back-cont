// src/services/favorite.service.ts
import { favoriteModel } from '../models/favorite.model';

class FavoriteService {
  async getAllFavorites() {
    return await favoriteModel.getAllFavorites();
  }

  async createFavorite(data: { usuario_id: number; libro_id: number }) {
    return await favoriteModel.createFavorite(data);
  }

  async getFavoritesByUser(usuarioId: number) {
    return await favoriteModel.getFavoritesByUser(usuarioId);
  }

  async deleteFavorite(usuarioId: number, libroId: number) {
    return await favoriteModel.deleteFavorite(usuarioId, libroId);
  }
}

export const favoriteService = new FavoriteService();