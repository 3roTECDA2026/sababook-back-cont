import { prisma } from '../db/connect/db';

export interface ActividadFeed {
  actividad_id: number;
  usuario_id: number | null;
  tipo: string;
  titulo: string;
  descripcion: string | null;
  entidad_id: number | null;
  fecha: Date;
  usuario_nombre: string | null;
  usuario_avatar: string | null;
}

export const obtenerActividadesFeedDB = async (
  page: number = 1,
  limit: number = 20
): Promise<{ actividades: ActividadFeed[]; total: number }> => {
  const skip = (page - 1) * limit;

  const [actividades, total] = await Promise.all([
    prisma.actividad_feed.findMany({
      take: limit,
      skip: skip,
      orderBy: {
        fecha: 'desc',
      },
      include: {
        usuario: {
          select: {
            nombre: true,
            avatar_url: true,
          },
        },
      },
    }),
    prisma.actividad_feed.count(),
  ]);

  const actividadesFormateadas: ActividadFeed[] = actividades.map((a) => ({
    actividad_id: a.actividad_id,
    usuario_id: a.usuario_id,
    tipo: a.tipo,
    titulo: a.titulo,
    descripcion: a.descripcion,
    entidad_id: a.entidad_id,
    fecha: a.fecha,
    usuario_nombre: a.usuario?.nombre ?? null,
    usuario_avatar: a.usuario?.avatar_url ?? null,
  }));

  return { actividades: actividadesFormateadas, total };
};