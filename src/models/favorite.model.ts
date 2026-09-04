// src/models/favorite.model.ts
import { prisma } from '../db/connect/db.js';

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
    const nuevoFavorito = await prisma.favorito.create({
      data: {
        usuario_id,
        libro_id,
      },
    });

    return {
      usuario_id: nuevoFavorito.usuario_id,
      libro_id: nuevoFavorito.libro_id,
    };
  },

  async getAllFavorites(): Promise<Favorite[]> {
    const favoritos = await prisma.favorito.findMany();
    return favoritos.map((f) => ({
      usuario_id: f.usuario_id,
      libro_id: f.libro_id,
    }));
  },

  async getFavoritesByUser(usuario_id: number): Promise<FavoriteBook[]> {
    const favoritos = await prisma.favorito.findMany({
      where: { usuario_id },
      include: {
        libro: true,
      },
    });

    return favoritos.map((f) => ({
      libro_id: f.libro.libro_id,
      titulo: f.libro.titulo,
      autor: f.libro.autor,
      genero: f.libro.genero ?? '',
      descripcion: f.libro.descripcion ?? '',
      portada_url: f.libro.portada_url ?? '',
      calificacion_promedio: Number(f.libro.calificacion_promedio ?? 0),
    }));
  },

  async deleteFavorite(usuario_id: number, libro_id: number): Promise<boolean> {
    try {
      const result = await prisma.favorito.deleteMany({
        where: {
          usuario_id,
          libro_id,
        },
      });

      return result.count > 0;
    } catch (error) {
      console.error('Error al eliminar favorito:', error);
      return false;
    }
  },
};