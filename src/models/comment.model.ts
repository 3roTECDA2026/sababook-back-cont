// src/models/comment.model.ts
import { prisma } from '../db/connect/db.js';

interface ComentarioForo {
  comentario_id: number;
  foro_id: number;
  usuario_id: number;
  contenido: string;
  fecha: Date;
}

interface ComentarioConUsuario extends ComentarioForo {
  nombre: string;
  email: string;
}

export const insertarComentario = async (
  foro_id: number,
  usuario_id: number,
  contenido: string
): Promise<{ comentario_id: number }> => {
  try {
    const nuevoComentario = await prisma.comentario_foro.create({
      data: {
        foro_id,
        usuario_id,
        contenido,
      },
      select: {
        comentario_id: true,
      },
    });

    return nuevoComentario;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error OpinionModel.createOpinion:', message);
    throw error;
  }
};

export const obtenerComentariosPorForo = async (foro_id: number): Promise<ComentarioConUsuario[]> => {
  const comentarios = await prisma.comentario_foro.findMany({
    where: { foro_id },
    include: {
      usuario: {
        select: {
          usuario_id: true,
          nombre: true,
          email: true,
        },
      },
    },
    orderBy: {
      fecha: 'asc',
    },
  });

  return comentarios.map((item) => ({
    comentario_id: item.comentario_id,
    foro_id: item.foro_id,
    usuario_id: item.usuario_id,
    contenido: item.contenido,
    fecha: item.fecha ?? new Date(),
    nombre: item.usuario?.nombre ?? '',
    email: item.usuario?.email ?? '',
  }));
};

export const obtenerTodosComentarios = async (): Promise<ComentarioForo[]> => {
  const result = await prisma.comentario_foro.findMany({
    orderBy: {
      fecha: 'asc',
    },
  });

  return result.map((item) => ({
    ...item,
    fecha: item.fecha ?? new Date(),
  }));
};

export const obtenerComentarioPorId = async (comentario_id: number): Promise<ComentarioForo | undefined> => {
  const result = await prisma.comentario_foro.findUnique({
    where: { comentario_id },
  });

  if (!result) return undefined;

  return {
    ...result,
    fecha: result.fecha ?? new Date(),
  };
};

export const actualizarComentarioPorId = async (
  comentario_id: number,
  contenido: string
): Promise<{ comentario_id: number }> => {
  const result = await prisma.comentario_foro.update({
    where: { comentario_id },
    data: { contenido },
    select: {
      comentario_id: true,
    },
  });

  return result;
};

export const eliminarComentarioPorId = async (comentario_id: number): Promise<{ comentario_id: number }> => {
  const result = await prisma.comentario_foro.delete({
    where: { comentario_id },
    select: {
      comentario_id: true,
    },
  });

  return result;
};