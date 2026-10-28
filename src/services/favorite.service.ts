
import {
  favoriteModel,
  ReadingStatus,
} from '../models/favorite.model';

class FavoriteService {
  // ==========================================
  // FAVORITOS
  // ==========================================

  async getAllFavorites() {
    return await favoriteModel.getAllFavorites();
  }

  async createFavorite(data: {
    usuario_id: number;
    libro_id: number;
  }) {
    return await favoriteModel.createFavorite(data);
  }

  async getFavoritesByUser(usuarioId: number) {
    return await favoriteModel.getFavoritesByUser(usuarioId);
  }

  // ==========================================
  // ESTADOS DE LECTURA - SAB-059
  // ==========================================

  async getReadingStatusesByUser(usuarioId: number) {
    return await favoriteModel.getReadingStatusesByUser(
      usuarioId
    );
  }

  async updateReadingStatus(
    usuarioId: number,
    libroId: number,
    estadoLectura: ReadingStatus
  ) {
    return await favoriteModel.updateReadingStatus(
      usuarioId,
      libroId,
      estadoLectura
    );
  }

  // ==========================================
  // CONTADOR DE LIBROS LEÍDOS
  // ==========================================

  async countReadBooks(usuarioId: number) {
    return await favoriteModel.countReadBooks(usuarioId);
  }

  // ==========================================
  // PROGRESO INDIVIDUAL - SAB-91
  // ==========================================

  async getReadingProgress(
    usuarioId: number,
    libroId: number
  ) {
    return await favoriteModel.getReadingProgress(
      usuarioId,
      libroId
    );
  }

  async updateReadingProgress(
    usuarioId: number,
    libroId: number,
    paginaActual: number
  ) {
    return await favoriteModel.updateReadingProgress(
      usuarioId,
      libroId,
      paginaActual
    );
  }

  // ==========================================
  // ELIMINAR FAVORITO
  // ==========================================

  async deleteFavorite(
    usuarioId: number,
    libroId: number
  ) {
    return await favoriteModel.deleteFavorite(
      usuarioId,
      libroId
    );
  }
}

export const favoriteService = new FavoriteService();
