// src/models/medal.model.ts
import { prisma } from '../db/connect/db.js';

interface Medalla {
  medalla_id: number;
  nombre: string;
  descripcion: string;
  tipo_accion: string;
}

class MedalModel {
  async verificarYAsignarMedallas(usuario_id: number): Promise<void> {
    try {
      // Verificar cantidad de opiniones
      const cantidadOpiniones = await prisma.opinion.count({
        where: { usuario_id },
      });

      console.log('cantidadOpiniones', cantidadOpiniones);

      if (cantidadOpiniones >= 1) {
        await this.asignarMedallaSiNoTiene(usuario_id, 6); // medalla_id para 'Opinador' de libros
      }
      if (cantidadOpiniones >= 10) {
        await this.asignarMedallaSiNoTiene(usuario_id, 1); // medalla_id para 'Debatiente' de libros
      }

      // Verificar cantidad de participaciones en foros
      const cantidadForos = await prisma.comentario_foro.count({
        where: { usuario_id },
      });

      if (cantidadForos >= 1) {
        await this.asignarMedallaSiNoTiene(usuario_id, 5); // medalla_id para 'Comentador' de foros
      }
      if (cantidadForos >= 10) {
        await this.asignarMedallaSiNoTiene(usuario_id, 2); // medalla_id para 'Comentador Activo' de foros
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error al verificar o asignar medallas:', message);
    }
  }

  async asignarMedallaSiNoTiene(usuario_id: number, medalla_id: number): Promise<void> {
    try {
      // Verifica si el usuario ya tiene la medalla
      const yaTiene = await prisma.usuario_medalla.findUnique({
        where: {
          usuario_id_medalla_id: {
            usuario_id,
            medalla_id,
          },
        },
      });

      console.log('yaTiene', yaTiene, usuario_id, medalla_id);

      if (!yaTiene) {
        await prisma.usuario_medalla.create({
          data: {
            usuario_id,
            medalla_id,
          },
        });

        console.log(`✅ Medalla id ${medalla_id} asignada al usuario ${usuario_id}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error al asignar medalla ${medalla_id} al usuario ${usuario_id}:`, message);
    }
  }

  // Obtener todas las medallas de un usuario
  async obtenerMedallasPorUsuario(usuario_id: number): Promise<Medalla[]> {
    try {
      const usuarioMedallas = await prisma.usuario_medalla.findMany({
        where: { usuario_id },
        include: {
          medalla: true,
        },
      });

      return usuarioMedallas.map((um) => ({
        medalla_id: um.medalla.medalla_id,
        nombre: um.medalla.nombre,
        descripcion: um.medalla.descripcion ?? '',
        tipo_accion: um.medalla.tipo_accion ?? '',
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error al obtener medallas del usuario:', message);
      throw error;
    }
  }
}

export const medalModel = new MedalModel();