// src/models/radio.model.ts
import { prisma } from '../db/connect/db';
import { TipoActividad } from '@prisma/client';

export interface EpisodioRadio {
  episodio_id: number;
  titulo: string;
  descripcion: string | null;
  audio_url: string;
  programa: string | null;
  fecha_emision: Date;
}

// Crear episodio en la base de datos y registrar en actividad_feed [REQ-05]
export const crearEpisodioDB = async (
  titulo: string,
  audio_url: string,
  descripcion?: string,
  programa?: string,
  creador_id?: number
): Promise<{ episodio_id: number }> => {
  const episodio = await prisma.radio_episodio.create({
    data: {
      titulo,
      audio_url,
      descripcion: descripcion ?? null,
      programa: programa ?? null,
    },
    select: {
      episodio_id: true,
    },
  });

  // Registrar en actividad_feed [REQ-05]
  try {
    await prisma.actividad_feed.create({
      data: {
        usuario_id: creador_id ? Number(creador_id) : null,
        tipo: TipoActividad.RADIO_EPISODIO,
        titulo: `Nuevo episodio de Radio Sábato: ${titulo}`,
        descripcion: descripcion ?? undefined,
        entidad_id: episodio.episodio_id,
      },
    });
  } catch (error) {
    console.error('⚠️ No se pudo registrar la actividad en el feed:', error);
  }

  return episodio;
};

// Obtener todos los episodios
export const obtenerTodosEpisodiosDB = async (): Promise<EpisodioRadio[]> => {
  const episodios = await prisma.radio_episodio.findMany({
    orderBy: {
      fecha_emision: 'desc',
    },
  });

  return episodios.map((e) => ({
    episodio_id: e.episodio_id,
    titulo: e.titulo,
    descripcion: e.descripcion,
    audio_url: e.audio_url,
    programa: e.programa,
    fecha_emision: e.fecha_emision ?? new Date(),
  }));
};

// Obtener un episodio por ID
export const obtenerEpisodioPorIdDB = async (
  episodio_id: number
): Promise<EpisodioRadio | null> => {
  const e = await prisma.radio_episodio.findUnique({
    where: { episodio_id },
  });

  if (!e) return null;

  return {
    episodio_id: e.episodio_id,
    titulo: e.titulo,
    descripcion: e.descripcion,
    audio_url: e.audio_url,
    programa: e.programa,
    fecha_emision: e.fecha_emision ?? new Date(),
  };
};

// Eliminar un episodio
export const eliminarEpisodioDB = async (
  episodio_id: number
): Promise<{ episodio_id: number } | null> => {
  try {
    const result = await prisma.radio_episodio.delete({
      where: { episodio_id },
      select: {
        episodio_id: true,
      },
    });
    return result;
  } catch (error) {
    return null;
  }
};