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

// Una fila de favorito representa un libro en la biblioteca del alumno: puede estar
// ahí por ser favorito (es_favorito = true) y/o por tener un estado de lectura
// distinto de 'general'. Ambas cosas son independientes (SAB-087).
const ESTADO_GENERAL: ReadingStatus = 'general';

export const favoriteModel = {
  // Marca el libro como favorito (corazón). Si ya existe la fila porque el alumno
  // le había puesto un estado de lectura, solo se activa el flag sin tocar el estado.
  async createFavorite({ usuario_id, libro_id }: Favorite): Promise<Favorite> {
    const favorito = await prisma.favorito.upsert({
      where: { usuario_id_libro_id: { usuario_id, libro_id } },
      update: { es_favorito: true },
      create: { usuario_id, libro_id, es_favorito: true },
    });

    return {
      usuario_id: favorito.usuario_id,
      libro_id: favorito.libro_id,
    };
  },

  async getAllFavorites(): Promise<Favorite[]> {
    const favoritos = await prisma.favorito.findMany({ where: { es_favorito: true } });
    return favoritos.map((f) => ({
      usuario_id: f.usuario_id,
      libro_id: f.libro_id,
    }));
  },

  // Solo los libros marcados con el corazón. El estado de lectura sigue viajando
  // para que el front pueda mostrarlo, pero no define la pertenencia a favoritos.
  async getFavoritesByUser(usuario_id: number): Promise<FavoriteBook[]> {
    const favoritos = await prisma.favorito.findMany({
      where: { usuario_id, es_favorito: true },
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

  // Cambia el estado de lectura sin tocar es_favorito.
  // - Poner un estado real (quiero-leer/leyendo/leido) en un libro que no estaba:
  //   crea la fila con es_favorito = false (marcar como leído NO lo hace favorito).
  // - Volver a 'general' un libro que no es favorito: lo saca de la biblioteca
  //   (se borra la fila, porque ya no hay nada que recordar).
  // - Volver a 'general' un libro favorito: conserva la fila (sigue siendo favorito).
  async updateReadingStatus(
    usuario_id: number,
    libro_id: number,
    estado_lectura: ReadingStatus
  ): Promise<ReadingStatusRecord> {
    const actual = await prisma.favorito.findUnique({
      where: { usuario_id_libro_id: { usuario_id, libro_id } },
      select: { estado_lectura: true, fecha_estado: true, es_favorito: true },
    });

    // El libro todavía no está en la biblioteca del alumno.
    if (!actual) {
      // Poner 'general' en un libro que no estaba no crea nada.
      if (estado_lectura === ESTADO_GENERAL) {
        return { libro_id, estado_lectura: ESTADO_GENERAL, fecha_estado: new Date() };
      }

      // Se agrega con ese estado, pero no como favorito.
      const creado = await prisma.favorito.create({
        data: { usuario_id, libro_id, estado_lectura, es_favorito: false },
        select: { libro_id: true, estado_lectura: true, fecha_estado: true },
      });

      return {
        libro_id: creado.libro_id,
        estado_lectura: creado.estado_lectura as ReadingStatus,
        fecha_estado: creado.fecha_estado,
      };
    }

    // "Desmarcar" (volver a 'general') un libro que no es favorito: se quita de la biblioteca.
    if (estado_lectura === ESTADO_GENERAL && !actual.es_favorito) {
      await prisma.favorito.delete({
        where: { usuario_id_libro_id: { usuario_id, libro_id } },
      });
      return { libro_id, estado_lectura: ESTADO_GENERAL, fecha_estado: actual.fecha_estado };
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

  // Quita el corazón. Si el libro tiene un estado de lectura, conserva la fila
  // (sigue en la biblioteca con su estado); si no, la elimina.
  async deleteFavorite(usuario_id: number, libro_id: number): Promise<boolean> {
    const actual = await prisma.favorito.findUnique({
      where: { usuario_id_libro_id: { usuario_id, libro_id } },
      select: { estado_lectura: true },
    });

    if (!actual) {
      return false;
    }

    if (actual.estado_lectura === ESTADO_GENERAL) {
      await prisma.favorito.delete({
        where: { usuario_id_libro_id: { usuario_id, libro_id } },
      });
      return true;
    }

    await prisma.favorito.update({
      where: { usuario_id_libro_id: { usuario_id, libro_id } },
      data: { es_favorito: false },
    });
    return true;
  },
};