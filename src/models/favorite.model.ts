// src/models/favorite.model.ts
import { db } from '../db/connect/db.js';

interface Favorite {
  usuario_id: number;
  libro_id: number;
}

interface FavoriteBook {
  libro_id: number;
  titulo: string;
  autor: string;
  genero: string;
  descripcion: string;
  portada_url: string;
  calificacion_promedio: number;
}

export const favoriteModel = {
  async createFavorite({ usuario_id, libro_id }: Favorite): Promise<Favorite> {
    const query = `
      INSERT INTO favorito (usuario_id, libro_id)
      VALUES ($1, $2)
      RETURNING *;
    `;
    return db.one<Favorite>(query, [usuario_id, libro_id]);
  },

  async getAllFavorites(): Promise<Favorite[]> {
    const query = `SELECT * FROM favorito;`;
    return db.any<Favorite>(query);
  },

  async getFavoritesByUser(usuario_id: number): Promise<FavoriteBook[]> {
    const query = `
      SELECT f.libro_id, l.titulo, l.autor, l.genero, l.descripcion, l.portada_url, l.calificacion_promedio
      FROM favorito f
      JOIN libro l ON f.libro_id = l.libro_id
      WHERE f.usuario_id = $1;
    `;
    return db.any<FavoriteBook>(query, [usuario_id]);
  },

  async deleteFavorite(usuario_id: number, libro_id: number): Promise<boolean> {
    const query = `
      DELETE FROM favorito
      WHERE usuario_id = $1 AND libro_id = $2;
    `;
    const result = await db.result(query, [usuario_id, libro_id]);
    return result.rowCount > 0;
  },
};