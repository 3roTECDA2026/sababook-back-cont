
import { Request, Response } from 'express';
import { sincronizarRadioSabato } from '../services/radioScraper.service.js';
import * as radioModel from '../models/radio.model.js';

// 1. Obtener todos los episodios
export const obtenerTodosEpisodios = async (req: Request, res: Response) => {
  try {
    const episodios = await radioModel.obtenerTodosEpisodiosDB();
    return res.status(200).json(episodios);
  } catch (error) {
    console.error('Error al obtener episodios:', error);
    return res.status(500).json({ mensaje: 'Error al obtener los episodios' });
  }
};

// 2. Obtener información del programa actual
export const obtenerProgramaActual = async (req: Request, res: Response) => {
  try {
    const episodios = await radioModel.obtenerTodosEpisodiosDB();
    const ultimo = episodios.length > 0 ? episodios[0] : null;

    return res.status(200).json({
      programa: ultimo?.programa || 'Radio Sábato',
      locutor: ultimo?.titulo || 'Transmisión General',
      enVivo: false,
    });
  } catch (error) {
    console.error('Error al obtener programa actual:', error);
    return res.status(500).json({
      mensaje: 'Error al obtener el programa actual',
    });
  }
};

// 3. Obtener episodio por ID
export const obtenerEpisodioPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const episodioId = Number(id);

    if (!Number.isInteger(episodioId) || episodioId <= 0) {
      return res.status(400).json({
        mensaje: 'ID de episodio inválido',
      });
    }

    const episodio = await radioModel.obtenerEpisodioPorIdDB(episodioId);

    if (!episodio) {
      return res.status(404).json({
        mensaje: 'Episodio no encontrado',
      });
    }

    return res.status(200).json(episodio);
  } catch (error) {
    console.error('Error al obtener el episodio:', error);
    return res.status(500).json({
      mensaje: 'Error al obtener el episodio',
    });
  }
};

// 4. Crear episodio
export const crearEpisodio = async (req: Request, res: Response) => {
  try {
    const { titulo, audio_url, descripcion, programa } = req.body;

    if (!titulo || !audio_url) {
      return res.status(400).json({
        mensaje: 'El título y la URL del audio son obligatorios',
      });
    }

    const nuevoEpisodio = await radioModel.crearEpisodioDB(
      titulo,
      audio_url,
      descripcion,
      programa
    );

    return res.status(201).json(nuevoEpisodio);
  } catch (error) {
    console.error('Error al crear episodio:', error);
    return res.status(500).json({
      mensaje: 'Error al crear el episodio',
    });
  }
};

// 5. Eliminar episodio
export const eliminarEpisodio = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const episodioId = Number(id);

    if (!Number.isInteger(episodioId) || episodioId <= 0) {
      return res.status(400).json({
        mensaje: 'ID de episodio inválido',
      });
    }

    const eliminado = await radioModel.eliminarEpisodioDB(episodioId);

    if (!eliminado) {
      return res.status(404).json({
        mensaje: 'Episodio no encontrado',
      });
    }

    return res.status(200).json({
      mensaje: 'Episodio eliminado con éxito',
    });
  } catch (error) {
    console.error('Error al eliminar episodio:', error);
    return res.status(500).json({
      mensaje: 'Error al eliminar el episodio',
    });
  }
};

// 6. Sincronizar programas
export const sincronizarProgramas = async (req: Request, res: Response) => {
  try {
    const programasScraped = await sincronizarRadioSabato();
    const episodiosExistentes = await radioModel.obtenerTodosEpisodiosDB();

    let agregados = 0;
    const urlsExistentes = new Set(
      episodiosExistentes.map((episodio) => episodio.audio_url)
    );

    for (const prog of programasScraped) {
      if (!urlsExistentes.has(prog.audio_url)) {
        await radioModel.crearEpisodioDB(
          prog.titulo,
          prog.audio_url,
          prog.descripcion,
          prog.programa
        );

        urlsExistentes.add(prog.audio_url);
        agregados++;
      }
    }

    return res.status(200).json({
      mensaje: 'Sincronización completada con éxito',
      agregados,
    });
  } catch (error) {
    console.error('Error al sincronizar programas:', error);
    return res.status(500).json({
      mensaje: 'Error al sincronizar programas de radio',
    });
  }
};
