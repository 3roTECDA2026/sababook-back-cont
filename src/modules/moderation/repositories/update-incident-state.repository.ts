import { prisma } from '../../../db/connect/db';

export type IncidentDecision = 'aceptada' | 'rechazada';

export const updateIncidentState = async (
  incidenciaId: number,
  decision: IncidentDecision,
  revisorId?: number,
) => {
  return prisma.incidencia_moderacion.update({
    where: { incidencia_id: incidenciaId },
    data: {
      estado: decision,
      revisado_por: revisorId ?? undefined,
      fecha_revision: new Date(),
    },
  });
};
