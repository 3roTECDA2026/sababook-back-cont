// src/services/review.service.ts
import { opinionModel } from '../models/opinion.model';
import { medalService } from './medal.service';
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