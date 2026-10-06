// src/services/medal.service.ts
import { medalModel } from '../models/medal.model';

class MedalService {
  async obtenerMedallasPorUsuario(usuarioId: number) {
    return await medalModel.obtenerMedallasPorUsuario(usuarioId);
  }

  async verificarYAsignarMedallas(usuarioId: number) {
    return await medalModel.verificarYAsignarMedallas(usuarioId);
  }
}

export const medalService = new MedalService();