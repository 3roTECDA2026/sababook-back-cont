import prisma from '../db/prisma';

export interface CreateMedalData {
  nombre: string;
  descripcion?: string;
  tipo_accion?: string;
}

class MedalService {
  // Obtener catálogo completo de medallas del sistema
  async obtenerTodas() {
    return await prisma.medalla.findMany({
      orderBy: {
        medalla_id: 'asc',
      },
    });
  }

  // Obtener las medallas obtenidas por un usuario
  async obtenerPorUsuario(usuario_id: number | string) {
    return await prisma.usuario_medalla.findMany({
      where: {
        usuario_id: Number(usuario_id),
      },
      include: {
        medalla: true,
      },
      orderBy: {
        fecha_obtenida: 'desc',
      },
    });
  }

  // Otorgar una medalla a un usuario (o retornar la existente si ya la posee)
  async otorgarMedalla(usuario_id: number | string, medalla_id: number | string) {
    const uId = Number(usuario_id);
    const mId = Number(medalla_id);

    return await prisma.usuario_medalla.upsert({
      where: {
        usuario_id_medalla_id: {
          usuario_id: uId,
          medalla_id: mId,
        },
      },
      update: {},
      create: {
        usuario_id: uId,
        medalla_id: mId,
      },
      include: {
        medalla: true,
      },
    });
  }

  // Crear una nueva definición de medalla (uso administrativo)
  async crearMedalla(data: CreateMedalData) {
    return await prisma.medalla.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipo_accion: data.tipo_accion,
      },
    });
  }

  // Eliminar/Revocar medalla otorgada a un usuario
  async revocarMedalla(usuario_id: number | string, medalla_id: number | string) {
    return await prisma.usuario_medalla.delete({
      where: {
        usuario_id_medalla_id: {
          usuario_id: Number(usuario_id),
          medalla_id: Number(medalla_id),
        },
      },
    });
  }
}

export default new MedalService();