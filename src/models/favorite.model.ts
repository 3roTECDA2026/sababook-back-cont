// src/models/favorite.model.ts
import { prisma } from '../db/connect/db';

interface Favorite {
  usuario_id: number;
  libro_id: number;
}

export type ReadingStatus = 'general' | 'quiero-leer' | 'leyendo' | 'leido';

export interface ReadingStatusRecord {
  libro_id: number;
  estado_lectura: ReadingStatus;
  fecha_estado: Date;
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
  fecha_estado: Date;
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
      fecha_estado: f.fecha_estado,
    }));
  },

  async getReadingStatusesByUser(usuario_id: number): Promise<ReadingStatusRecord[]> {
    const favoritos = await prisma.favorito.findMany({
      where: { usuario_id },
      select: {
        libro_id: true,
        estado_lectura: true,
        fecha_estado: true,
      },
    });

    return favoritos.map((favorito) => ({
      libro_id: favorito.libro_id,
      estado_lectura: favorito.estado_lectura as ReadingStatus,
      fecha_estado: favorito.fecha_estado,
    }));
  },

  async updateReadingStatus(
    usuario_id: number,
    libro_id: number,
    estado_lectura: ReadingStatus
  ): Promise<ReadingStatusRecord> {
    const actual = await prisma.favorito.findUnique({
      where: { usuario_id_libro_id: { usuario_id, libro_id } },
      select: { estado_lectura: true, fecha_estado: true },
    });

    // Si el libro todavía no está en la biblioteca del alumno, se agrega con ese estado
    // (por ejemplo, para poder marcar como leído cualquier libro)
    if (!actual) {
      const creado = await prisma.favorito.create({
        data: { usuario_id, libro_id, estado_lectura },
        select: { libro_id: true, estado_lectura: true, fecha_estado: true },
      });

      return {
        libro_id: creado.libro_id,
        estado_lectura: creado.estado_lectura as ReadingStatus,
        fecha_estado: creado.fecha_estado,
      };
    }

    // Si el estado no cambia, no se toca fecha_estado: volver a marcar
    // "leyendo" no debe reiniciar el tiempo que lleva el libro en ese estado.
    if (actual.estado_lectura === estado_lectura) {
      return { libro_id, estado_lectura, fecha_estado: actual.fecha_estado };
    }

    const actualizado = await prisma.favorito.update({
      where: { usuario_id_libro_id: { usuario_id, libro_id } },
      data: { estado_lectura, fecha_estado: new Date() },
      select: { libro_id: true, estado_lectura: true, fecha_estado: true },
    });

    return {
      libro_id: actualizado.libro_id,
      estado_lectura: actualizado.estado_lectura as ReadingStatus,
      fecha_estado: actualizado.fecha_estado,
    };
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