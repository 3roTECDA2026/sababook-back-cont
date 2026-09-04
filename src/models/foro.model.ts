// src/models/foro.model.ts
import { prisma } from '../db/connect/db.js';

interface Foro {
  foro_id: number;
  titulo: string;
  descripcion: string;
  creador_id: number;
  fecha_creacion: Date;
}

interface ForoConCreador extends Foro {
  creador_nombre: string | null;
}

interface ForoDetalle {
  foro_id: number;
  titulo: string;
  descripcion: string;
  fecha_creacion: Date;
  creador_nombre: string | null;
  creador_avatar: string | null;
}

interface ComentarioForo {
  comentario_id: number;
  contenido: string;
  fecha: Date;
  usuario_nombre: string;
  usuario_avatar: string | null;
}

interface ForoConComentarios extends ForoDetalle {
  comentarios: ComentarioForo[];
}

// Crear un foro
export const crearForoDB = async (
  titulo: string,
  descripcion: string,
  creador_id: number
): Promise<{ foro_id: number }> => {
  const result = await prisma.foro.create({
    data: {
      titulo,
      descripcion,
      creador_id,
    },
    select: {
      foro_id: true,
    },
  });
  return result;
};

// Obtener todos los foros
export const obtenerTodosForosDB = async (): Promise<ForoConCreador[]> => {
  const foros = await prisma.foro.findMany({
    include: {
      usuario: {
        select: {
          nombre: true,
        },
      },
    },
    orderBy: {
      fecha_creacion: 'desc',
    },
  });

  return foros.map((f) => ({
    foro_id: f.foro_id,
    titulo: f.titulo,
    descripcion: f.descripcion ?? '',
    creador_id: f.creador_id,
    fecha_creacion: f.fecha_creacion ?? new Date(),
    creador_nombre: f.usuario?.nombre ?? null,
  }));
};

// Obtener un foro por ID
export const obtenerForoPorIdDB = async (foro_id: number): Promise<ForoConCreador | null> => {
  const f = await prisma.foro.findUnique({
    where: { foro_id },
    include: {
      usuario: {
        select: {
          nombre: true,
        },
      },
    },
  });

  if (!f) return null;

  return {
    foro_id: f.foro_id,
    titulo: f.titulo,
    descripcion: f.descripcion ?? '',
    creador_id: f.creador_id,
    fecha_creacion: f.fecha_creacion ?? new Date(),
    creador_nombre: f.usuario?.nombre ?? null,
  };
};

// Actualizar un foro
export const actualizarForoDB = async (
  foro_id: number,
  titulo: string,
  descripcion: string
): Promise<{ foro_id: number }> => {
  const result = await prisma.foro.update({
    where: { foro_id },
    data: {
      titulo,
      descripcion,
    },
    select: {
      foro_id: true,
    },
  });
  return result;
};

// Eliminar un foro
export const eliminarForoDB = async (foro_id: number): Promise<{ foro_id: number } | null> => {
  try {
    const result = await prisma.foro.delete({
      where: { foro_id },
      select: {
        foro_id: true,
      },
    });
    return result;
  } catch (error) {
    return null;
  }
};

// Obtener foro con comentarios y datos de usuario
export const obtenerForoConComentariosDB = async (
  foro_id: number
): Promise<ForoConComentarios | null> => {
  const foro = await prisma.foro.findUnique({
    where: { foro_id },
    include: {
      usuario: {
        select: {
          nombre: true,
          avatar_url: true,
        },
      },
      comentario_foro: {
        include: {
          usuario: {
            select: {
              nombre: true,
              avatar_url: true,
            },
          },
        },
        orderBy: {
          fecha: 'asc',
        },
      },
    },
  });

  if (!foro) return null;

  const comentariosFormatted: ComentarioForo[] = foro.comentario_foro.map((c) => ({
    comentario_id: c.comentario_id,
    contenido: c.contenido,
    fecha: c.fecha ?? new Date(),
    usuario_nombre: c.usuario?.nombre ?? '',
    usuario_avatar: c.usuario?.avatar_url ?? null,
  }));

  return {
    foro_id: foro.foro_id,
    titulo: foro.titulo,
    descripcion: foro.descripcion ?? '',
    fecha_creacion: foro.fecha_creacion ?? new Date(),
    creador_nombre: foro.usuario?.nombre ?? null,
    creador_avatar: foro.usuario?.avatar_url ?? null,
    comentarios: comentariosFormatted,
  };
};