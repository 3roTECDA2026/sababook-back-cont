// src/models/cafe.model.ts
import { prisma } from '../db/connect/db';

interface CafeDatos {
  titulo: string;
  descripcion: string | null;
  libro_id: number | null;
  docente_id: number | null;
  fecha_evento: Date;
  lugar?: string | null;
}

interface CafeDetalle {
  cafe_id: number;
  titulo: string;
  descripcion: string | null;
  fecha_evento: Date;
  lugar: string | null;
  estado: string | null;
  fecha_creacion: Date | null;
  libro_id: number | null;
  libro_titulo: string | null;
  libro_autor: string | null;
  libro_genero: string | null;
  libro_descripcion: string | null;
  libro_portada: string | null;
  docente_id: number | null;
  docente_nombre: string | null;
  docente_avatar: string | null;
  foro_id: number | null;
  total_asistentes: number;
  votos_positivos: number;
  votos_negativos: number;
  total_votos: number;
  asistencia_usuario: string | null;
  voto_usuario: boolean | null;
}

// Crear un nuevo Café Literario y su foro asociado (en una transacción)
export const crearCafeDB = async (
  datos: CafeDatos
): Promise<{ cafe_id: number; foro_id: number }> => {
  const { titulo, descripcion, libro_id, docente_id, fecha_evento, lugar } = datos;

  return await prisma.$transaction(async (tx) => {
    const cafe = await tx.cafe_literario.create({
      data: {
        titulo,
        descripcion,
        libro_id,
        docente_id,
        fecha_evento,
        lugar: lugar ?? null,
      },
      select: {
        cafe_id: true,
      },
    });

    const foroTitulo = `Foro de Debate: ${titulo}`;
    const foroDesc = 'Espacio de discusión y opiniones para el Café Literario sobre la lectura propuesta.';
    const foro = await tx.foro.create({
      data: {
        titulo: foroTitulo,
        descripcion: foroDesc,
        creador_id: docente_id,
        cafe_id: cafe.cafe_id,
      },
      select: {
        foro_id: true,
      },
    });

    return { cafe_id: cafe.cafe_id, foro_id: foro.foro_id };
  });
};

// Obtener todos los Cafés Literarios con información agregada (libro, docente, asistencias, votos)
export const obtenerCafesDB = async (usuario_id: number | null = null): Promise<CafeDetalle[]> => {
  const cafes = await prisma.cafe_literario.findMany({
    include: {
      libro: {
        select: {
          libro_id: true,
          titulo: true,
          autor: true,
          portada_url: true,
        },
      },
      usuario: {
        select: {
          usuario_id: true,
          nombre: true,
          avatar_url: true,
        },
      },
      foro: {
        select: {
          foro_id: true,
        },
      },
      asistencia_cafe: {
        select: {
          usuario_id: true,
          estado: true,
        },
      },
      voto_cafe: {
        select: {
          usuario_id: true,
          voto: true,
        },
      },
    },
    orderBy: {
      fecha_evento: 'desc',
    },
  });

  return cafes.map((c) => formatCafeDetalle(c, usuario_id));
};

// Obtener un Café Literario específico por ID con detalles completos
export const obtenerCafePorIdDB = async (cafe_id: number): Promise<CafeDetalle | null> => {
  const cafe = await prisma.cafe_literario.findUnique({
    where: { cafe_id },
    include: {
      libro: {
        select: {
          libro_id: true,
          titulo: true,
          autor: true,
          genero: true,
          descripcion: true,
          portada_url: true,
        },
      },
      usuario: {
        select: {
          usuario_id: true,
          nombre: true,
          avatar_url: true,
        },
      },
      foro: {
        select: {
          foro_id: true,
        },
      },
      asistencia_cafe: {
        select: {
          usuario_id: true,
          estado: true,
        },
      },
      voto_cafe: {
        select: {
          usuario_id: true,
          voto: true,
        },
      },
    },
  });

  if (!cafe) return null;

  return formatCafeDetalle(cafe, null);
};

// Actualizar un Café Literario (solo actualiza los campos recibidos)
export const actualizarCafeDB = async (
  cafe_id: number,
  datos: {
    titulo?: string | null;
    descripcion?: string | null;
    libro_id?: number | null;
    fecha_evento?: Date | null;
    lugar?: string | null;
    estado?: string | null;
  }
): Promise<{ cafe_id: number } | null> => {
  const { titulo, descripcion, libro_id, fecha_evento, lugar, estado } = datos;

  const data: Record<string, unknown> = {};
  if (titulo !== undefined && titulo !== null) data.titulo = titulo;
  if (descripcion !== undefined && descripcion !== null) data.descripcion = descripcion;
  if (libro_id !== undefined && libro_id !== null) data.libro_id = libro_id;
  if (fecha_evento !== undefined && fecha_evento !== null) data.fecha_evento = fecha_evento;
  if (lugar !== undefined && lugar !== null) data.lugar = lugar;
  if (estado !== undefined && estado !== null) data.estado = estado;

  try {
    return await prisma.cafe_literario.update({
      where: { cafe_id },
      data,
      select: {
        cafe_id: true,
      },
    });
  } catch (error) {
    return null;
  }
};

// Eliminar un Café Literario
export const eliminarCafeDB = async (cafe_id: number): Promise<{ cafe_id: number } | null> => {
  try {
    return await prisma.cafe_literario.delete({
      where: { cafe_id },
      select: {
        cafe_id: true,
      },
    });
  } catch (error) {
    return null;
  }
};

// ----------------- ASISTENCIA (RSVP) -----------------

// Registrar o actualizar la asistencia de un usuario a un café
export const registrarAsistenciaDB = async (
  cafe_id: number,
  usuario_id: number,
  estado = 'confirmado'
) => {
  return await prisma.asistencia_cafe.upsert({
    where: {
      cafe_id_usuario_id: { cafe_id, usuario_id },
    },
    create: {
      cafe_id,
      usuario_id,
      estado,
    },
    update: {
      estado,
      fecha_registro: new Date(),
    },
  });
};

// Cancelar/Quitar asistencia de un usuario a un café
export const eliminarAsistenciaDB = async (cafe_id: number, usuario_id: number) => {
  return await prisma.asistencia_cafe.deleteMany({
    where: { cafe_id, usuario_id },
  });
};

// Obtener la asistencia específica de un usuario para un café
export const obtenerAsistenciaUsuarioDB = async (cafe_id: number, usuario_id: number) => {
  return await prisma.asistencia_cafe.findFirst({
    where: { cafe_id, usuario_id },
  });
};

// Obtener la lista de asistentes a un café
export const obtenerAsistentesCafeDB = async (cafe_id: number) => {
  return await prisma.asistencia_cafe.findMany({
    where: { cafe_id },
    include: {
      usuario: {
        select: {
          usuario_id: true,
          nombre: true,
          email: true,
          avatar_url: true,
        },
      },
    },
    orderBy: {
      fecha_registro: 'desc',
    },
  });
};

// ----------------- VOTACIÓN POST-LECTURA -----------------

// Registrar o actualizar el voto del usuario ("¿Te gustó el libro del Café?")
export const registrarVotoDB = async (cafe_id: number, usuario_id: number, voto: boolean) => {
  return await prisma.voto_cafe.upsert({
    where: {
      cafe_id_usuario_id: { cafe_id, usuario_id },
    },
    create: {
      cafe_id,
      usuario_id,
      voto,
    },
    update: {
      voto,
      fecha_voto: new Date(),
    },
  });
};

// Obtener el voto emitido por un usuario para un café específico
export const obtenerVotoUsuarioDB = async (cafe_id: number, usuario_id: number) => {
  return await prisma.voto_cafe.findFirst({
    where: { cafe_id, usuario_id },
  });
};

// ----------------- FORMATO COMÚN -----------------

interface CafeRow {
  cafe_id: number;
  titulo: string;
  descripcion: string | null;
  fecha_evento: Date;
  lugar: string | null;
  estado: string | null;
  fecha_creacion: Date | null;
  libro: {
    libro_id: number;
    titulo: string;
    autor: string;
    genero?: string | null;
    descripcion?: string | null;
    portada_url: string | null;
  } | null;
  usuario: {
    usuario_id: number;
    nombre: string;
    avatar_url: string | null;
  } | null;
  foro: { foro_id: number }[];
  asistencia_cafe: { usuario_id: number; estado: string }[];
  voto_cafe: { usuario_id: number; voto: boolean }[];
}

const formatCafeDetalle = (c: CafeRow, usuario_id: number | null): CafeDetalle => {
  const asistencias = c.asistencia_cafe;
  const votos = c.voto_cafe;

  const total_asistentes = asistencias.filter(
    (a) => a.estado === 'confirmado' || a.estado === 'asistio'
  ).length;
  const votos_positivos = votos.filter((v) => v.voto === true).length;
  const votos_negativos = votos.filter((v) => v.voto === false).length;

  const asistencia_usuario =
    usuario_id !== null ? asistencias.find((a) => a.usuario_id === usuario_id)?.estado ?? null : null;
  const voto_usuario =
    usuario_id !== null ? votos.find((v) => v.usuario_id === usuario_id)?.voto ?? null : null;

  return {
    cafe_id: c.cafe_id,
    titulo: c.titulo,
    descripcion: c.descripcion,
    fecha_evento: c.fecha_evento,
    lugar: c.lugar,
    estado: c.estado,
    fecha_creacion: c.fecha_creacion,
    libro_id: c.libro?.libro_id ?? null,
    libro_titulo: c.libro?.titulo ?? null,
    libro_autor: c.libro?.autor ?? null,
    libro_genero: c.libro?.genero ?? null,
    libro_descripcion: c.libro?.descripcion ?? null,
    libro_portada: c.libro?.portada_url ?? null,
    docente_id: c.usuario?.usuario_id ?? null,
    docente_nombre: c.usuario?.nombre ?? null,
    docente_avatar: c.usuario?.avatar_url ?? null,
    foro_id: c.foro[0]?.foro_id ?? null,
    total_asistentes,
    votos_positivos,
    votos_negativos,
    total_votos: votos.length,
    asistencia_usuario,
    voto_usuario,
  };
};