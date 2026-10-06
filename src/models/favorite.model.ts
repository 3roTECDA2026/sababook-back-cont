// src/models/favorite.model.ts
import { prisma } from '../db/connect/db';

interface Favorite {
  usuario_id: number;
  libro_id: number;
}

export type ReadingStatus = 'general' | 'quiero-leer' | 'leyendo' | 'leido';

interface ReadingStatusRecord {
  libro_id: number;
  estado_lectura: ReadingStatus;
}

interface FavoriteBook {
  libro_id: number;
  titulo: string;
  autor: string;
  genero: string;
  descripcion: string;
  portada_url: string;
  calificacion_promedio: number;
  estado_lectura: ReadingStatus;
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
      estado_lectura: f.estado_lectura as ReadingStatus,
    }));
  },

  async getReadingStatusesByUser(usuario_id: number): Promise<ReadingStatusRecord[]> {
    const favoritos = await prisma.favorito.findMany({
      where: { usuario_id },
      select: {
        libro_id: true,
        estado_lectura: true,
      },
    });

    return favoritos.map((favorito) => ({
      libro_id: favorito.libro_id,
      estado_lectura: favorito.estado_lectura as ReadingStatus,
    }));
  },

  async updateReadingStatus(
    usuario_id: number,
    libro_id: number,
    estado_lectura: ReadingStatus
  ): Promise<ReadingStatusRecord | null> {
    const favorito = await prisma.favorito.updateMany({
      where: { usuario_id, libro_id },
      data: { estado_lectura },
    });

    if (favorito.count === 0) return null;

    return { libro_id, estado_lectura };
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