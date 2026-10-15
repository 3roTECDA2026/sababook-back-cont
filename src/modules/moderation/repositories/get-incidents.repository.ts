import { prisma } from '../../../db/connect/db';

export const getIncidents = async (limit = 50) => {
  return prisma.incidencia_moderacion.findMany({
    take: limit,
    orderBy: { fecha: 'desc' },
    include: {
      usuario: {
        select: {
          usuario_id: true,
          nombre: true,
          email: true,
        },
      },
    },
  });
};
