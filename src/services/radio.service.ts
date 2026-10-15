// src/services/radio.service.ts
import {
  crearEpisodioDB,
  obtenerTodosEpisodiosDB,
  obtenerEpisodioPorIdDB,
  eliminarEpisodioDB,
} from '../models/radio.model';

class RadioService {
  async crearEpisodio(
    titulo: string,
    audio_url: string,
    descripcion?: string,
    programa?: string,
    creador_id?: number
  ) {
    return await crearEpisodioDB(
      titulo,
      audio_url,
      descripcion,
      programa,
      creador_id
    );
  }

  async obtenerTodosEpisodios() {
    return await obtenerTodosEpisodiosDB();
  }

  async obtenerEpisodioPorId(id: number) {
    return await obtenerEpisodioPorIdDB(id);
  }

  async eliminarEpisodio(id: number) {
    return await eliminarEpisodioDB(id);
  }
}

export const radioService = new RadioService();