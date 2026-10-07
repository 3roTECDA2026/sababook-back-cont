import { opinionModel } from '../models/opinion.model';
import { medalService } from './medal.service';
import { prisma } from '../db/connect/db';
import leoProfanity from 'leo-profanity';

// Cargar diccionarios de moderación
leoProfanity.loadDictionary('en');
leoProfanity.loadDictionary('es');
leoProfanity.add(['mierda', 'pelotudo', 'boludo', 'Estupido']);

export interface CreateOpinionDTO {
  usuario_id: number;
  libro_id: number;
  calificacion: number;
  comentario: string;
}

export interface UpdateOpinionDTO {
  calificacion?: number;
  comentario?: string;
  [key: string]: any;
}

class ReviewService {
  private limpiarComentario(comentario: string): string {
    return leoProfanity.clean(comentario);
  }

  async getAllOpinions() {
    return await opinionModel.getAllOpinions();
  }

  async getOpinionById(id: number) {
    return await opinionModel.getOpinionById(id);
  }

  async createOpinion(data: CreateOpinionDTO) {
    const comentarioLimpio = this.limpiarComentario(data.comentario);

    // Anti-duplicados e idempotencia: si el usuario ya envió la misma reseña recientemente (< 60 segundos), devolver la existente
    const duplicadoReciente = await prisma.opinion.findFirst({
      where: {
        usuario_id: data.usuario_id,
        libro_id: data.libro_id,
      },
      orderBy: { fecha: 'desc' },
      include: {
        usuario: { select: { nombre: true } },
      },
    });

    if (duplicadoReciente) {
      const ahora = Date.now();
      const fechaCreacion = new Date(duplicadoReciente.fecha ?? 0).getTime();
      const sesentaSegundos = 60 * 1000;
      if (ahora - fechaCreacion < sesentaSegundos && duplicadoReciente.comentario === comentarioLimpio) {
        return {
          opinion_id: duplicadoReciente.opinion_id,
          usuario_id: duplicadoReciente.usuario_id,
          usuario_nombre: duplicadoReciente.usuario?.nombre ?? '',
          libro_id: duplicadoReciente.libro_id,
          calificacion: duplicadoReciente.calificacion,
          comentario: duplicadoReciente.comentario ?? '',
          fecha: duplicadoReciente.fecha ?? new Date(),
        };
      }
    }

    const newOpinion = await opinionModel.createOpinion({
      ...data,
      comentario: comentarioLimpio,
    });

    // Se delega al servicio de medallas
    await medalService.verificarYAsignarMedallas(data.usuario_id);

    return newOpinion;
  }

  async updateOpinion(id: number, data: UpdateOpinionDTO) {
    if (data.comentario) {
      data.comentario = this.limpiarComentario(data.comentario);
    }

    return await opinionModel.updateOpinion(id, data);
  }

  async deleteOpinion(id: number) {
    return await opinionModel.deleteOpinion(id);
  }

  async getOpinionsByLibro(libroId: number) {
    return await opinionModel.getOpinionsByLibro(libroId);
  }
}

export const reviewService = new ReviewService();