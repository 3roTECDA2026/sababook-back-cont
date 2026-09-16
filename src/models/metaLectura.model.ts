// src/models/metaLectura.model.ts
import { Prisma, meta_lectura as MetaLectura } from '@prisma/client';
import { prisma } from '../db/connect/db';

type CrearMetaInput = Omit<Prisma.meta_lecturaUncheckedCreateInput, 'meta_id' | 'fecha_creacion'>;

export interface MetaConProgreso extends MetaLectura {
  libros_leidos: number;
  porcentaje_progreso: number;
}

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
      // Contamos las opiniones/reseñas creadas por el usuario dentro del rango de la meta
      const librosLeidos = await prisma.opinion.count({
        where: {
          usuario_id: usuarioId,
          fecha: {
            gte: meta.fecha_inicio,
            lte: meta.fecha_fin,
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

// Eliminar una meta
export const eliminarMeta = async (metaId: number, usuarioId: number): Promise<boolean> => {
  const result = await prisma.meta_lectura.deleteMany({
    where: {
      meta_id: metaId,
      usuario_id: usuarioId,
    },
  });
  return result.count > 0;
};