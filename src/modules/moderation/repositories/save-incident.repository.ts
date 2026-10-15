import { prisma } from '../../../db/connect/db';
import { CreateIncidentDTO } from '../types/moderation.types';

export const saveIncident = async (dto: CreateIncidentDTO): Promise<number> => {
  const incident = await prisma.incidencia_moderacion.create({
    data: {
      usuario_id: dto.usuario_id,
      contexto: dto.contexto,
      contenido_bloqueado: dto.contenido_bloqueado,
      motivo: dto.motivo,
      categoria: dto.categoria,
    },
    select: { incidencia_id: true },
  });

  return incident.incidencia_id;
};
