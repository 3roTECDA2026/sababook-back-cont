import { Prisma, meta_lectura as MetaLectura } from '@prisma/client';
import { prisma } from '../db/connect/db';

type CrearMetaInput = Omit<Prisma.meta_lecturaUncheckedCreateInput, 'meta_id' | 'fecha_creacion'>;

export interface MetaConProgreso extends MetaLectura {
  libros_leidos: number;
  porcentaje_progreso: number;
}

const normalizarRangoFechas = (inicio: Date, fin: Date) => {
  const fechaInicio = new Date(inicio);
  const fechaFin = new Date(fin);
  
  // Incluye todas las reseñas hasta el último milisegundo del día de fin
  fechaFin.setHours(23, 59, 59, 999);

  return { fechaInicio, fechaFin };
};

// Crear una meta de lectura
export const crearMeta = async (datos: CrearMetaInput): Promise<MetaLectura> => {
  return await prisma.meta_lectura.create({
    data: datos,
  });
};

// Obtener todas las metas de un usuario con el cálculo de progreso
export const obtenerMetasPorUsuario = async (usuarioId: number): Promise<MetaConProgreso[]> => {
  const metas = await prisma.meta_lectura.findMany({
    where: { usuario_id: usuarioId },
    orderBy: { fecha_inicio: 'desc' },
  });

  const metasConProgreso = await Promise.all(
    metas.map(async (meta) => {
      const { fechaInicio, fechaFin } = normalizarRangoFechas(meta.fecha_inicio, meta.fecha_fin);

      // Contamos las opiniones dentro del rango exacto
      const librosLeidos = await prisma.opinion.count({
        where: {
          usuario_id: usuarioId,
          fecha: {
            gte: fechaInicio,
            lte: fechaFin,
          },
        },
      });

      const porcentaje = Math.min(
        100,
        Math.round((librosLeidos / meta.cantidad_libros) * 100)
      );

      return {
        ...meta,
        libros_leidos: librosLeidos,
        porcentaje_progreso: isNaN(porcentaje) ? 0 : porcentaje,
      };
    })
  );

  return metasConProgreso;
};

// Obtener todas las metas para el Admin
export const obtenerTodasLasMetas = async (): Promise<MetaConProgreso[]> => {
  const metas = await prisma.meta_lectura.findMany({
    include: {
      usuario: {
        select: {
          usuario_id: true,
          nombre: true,
          email: true,
          rol: true,
        },
      },
    },
    orderBy: { fecha_inicio: 'desc' },
  });

  const metasConProgreso = await Promise.all(
    metas.map(async (meta) => {
      const { fechaInicio, fechaFin } = normalizarRangoFechas(meta.fecha_inicio, meta.fecha_fin);

      const librosLeidos = await prisma.opinion.count({
        where: {
          usuario_id: meta.usuario_id,
          fecha: {
            gte: fechaInicio,
            lte: fechaFin,
          },
        },
      });

      const porcentaje = Math.min(
        100,
        Math.round((librosLeidos / meta.cantidad_libros) * 100)
      );

      return {
        ...meta,
        libros_leidos: librosLeidos,
        porcentaje_progreso: isNaN(porcentaje) ? 0 : porcentaje,
      };
    })
  );

  return metasConProgreso;
};

export const actualizarMeta = async (
  metaId: number,
  datos: Partial<CrearMetaInput>
): Promise<MetaLectura> => {
  return await prisma.meta_lectura.update({
    where: { meta_id: metaId },
    data: datos,
  });
};

// Eliminar una meta (el usuarioId pasa a ser opcional)
export const eliminarMeta = async (metaId: number, usuarioId?: number): Promise<boolean> => {
  const whereCondition: Prisma.meta_lecturaWhereInput = { meta_id: metaId };

  if (usuarioId) {
    whereCondition.usuario_id = usuarioId;
  }

  const result = await prisma.meta_lectura.deleteMany({
    where: whereCondition,
  });

  return result.count > 0;
};