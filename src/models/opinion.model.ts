// src/models/opinion.model.ts
import { prisma } from '../db/connect/db.js';

export interface Opinion {
  opinion_id: number;
  usuario_id: number;
  usuario_nombre?: string;
  libro_id: number;
  libro_titulo?: string;
  calificacion: number;
  comentario: string;
  fecha: Date;
}

interface CreateOpinionData {
  usuario_id: number;
  libro_id: number;
  calificacion: number;
  comentario: string;
}

type UpdateOpinionFields = Partial<Omit<Opinion, 'opinion_id' | 'usuario_nombre' | 'libro_titulo'>>;

class OpinionModel {
  async getAllOpinions(): Promise<Opinion[]> {
    try {
      const opiniones = await prisma.opinion.findMany({
        include: {
          usuario: {
            select: { nombre: true },
          },
          libro: {
            select: { titulo: true },
          },
        },
        orderBy: {
          fecha: 'desc',
        },
      });

      return opiniones.map((o) => ({
        opinion_id: o.opinion_id,
        usuario_id: o.usuario_id,
        usuario_nombre: o.usuario?.nombre ?? '',
        libro_id: o.libro_id,
        libro_titulo: o.libro?.titulo ?? '',
        calificacion: o.calificacion,
        comentario: o.comentario ?? '',
        fecha: o.fecha ?? new Date(),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error OpinionModel.getAllOpinions:', message);
      throw new Error('Failed to retrieve opinions.');
    }
  }

  async getOpinionById(opinionId: number): Promise<Opinion | null> {
    try {
      const o = await prisma.opinion.findUnique({
        where: { opinion_id: opinionId },
        include: {
          usuario: {
            select: { nombre: true },
          },
          libro: {
            select: { titulo: true },
          },
        },
      });

      if (!o) return null;

      return {
        opinion_id: o.opinion_id,
        usuario_id: o.usuario_id,
        usuario_nombre: o.usuario?.nombre ?? '',
        libro_id: o.libro_id,
        libro_titulo: o.libro?.titulo ?? '',
        calificacion: o.calificacion,
        comentario: o.comentario ?? '',
        fecha: o.fecha ?? new Date(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error OpinionModel.getOpinionById:', message);
      throw error;
    }
  }

  async createOpinion(opinionData: CreateOpinionData): Promise<Opinion> {
    const { usuario_id, libro_id, calificacion, comentario } = opinionData;
    const fecha = new Date();

    try {
      const nuevaOpinion = await prisma.opinion.create({
        data: {
          usuario_id,
          libro_id,
          calificacion,
          comentario,
          fecha,
        },
        include: {
          usuario: {
            select: { nombre: true },
          },
        },
      });

      return {
        opinion_id: nuevaOpinion.opinion_id,
        usuario_id: nuevaOpinion.usuario_id,
        usuario_nombre: nuevaOpinion.usuario?.nombre ?? '',
        libro_id: nuevaOpinion.libro_id,
        calificacion: nuevaOpinion.calificacion,
        comentario: nuevaOpinion.comentario ?? '',
        fecha: nuevaOpinion.fecha ?? fecha,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error OpinionModel.createOpinion:', message);
      throw error;
    }
  }

  async updateOpinion(opinionId: number, updatedFields: UpdateOpinionFields): Promise<Opinion> {
    // Filtrar campos undefined
    const dataToUpdate: Record<string, any> = {};
    Object.keys(updatedFields).forEach((key) => {
      const val = (updatedFields as any)[key];
      if (val !== undefined) {
        dataToUpdate[key] = val;
      }
    });

    if (Object.keys(dataToUpdate).length === 0) {
      throw new Error('No data provided for update.');
    }

    try {
      const updated = await prisma.opinion.update({
        where: { opinion_id: opinionId },
        data: dataToUpdate,
      });

      return {
        opinion_id: updated.opinion_id,
        usuario_id: updated.usuario_id,
        libro_id: updated.libro_id,
        calificacion: updated.calificacion,
        comentario: updated.comentario ?? '',
        fecha: updated.fecha ?? new Date(),
      };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error(`Opinion ID ${opinionId} not found.`);
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error OpinionModel.updateOpinion:', message);
      throw error;
    }
  }

  async deleteOpinion(opinionId: number): Promise<boolean> {
    try {
      await prisma.opinion.delete({
        where: { opinion_id: opinionId },
      });
      return true;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error(`Opinion ID ${opinionId} not found.`);
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error OpinionModel.deleteOpinion:', message);
      throw error;
    }
  }

  async getOpinionsByLibro(libroId: number): Promise<Opinion[]> {
    try {
      const opiniones = await prisma.opinion.findMany({
        where: { libro_id: libroId },
        include: {
          usuario: {
            select: { nombre: true },
          },
        },
        orderBy: {
          fecha: 'desc',
        },
      });

      return opiniones.map((o) => ({
        opinion_id: o.opinion_id,
        usuario_id: o.usuario_id,
        usuario_nombre: o.usuario?.nombre ?? '',
        libro_id: o.libro_id,
        calificacion: o.calificacion,
        comentario: o.comentario ?? '',
        fecha: o.fecha ?? new Date(),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error OpinionModel.getOpinionsByLibro:', message);
      throw new Error('Failed to retrieve opinions for libro.');
    }
  }
}

export const opinionModel = new OpinionModel();