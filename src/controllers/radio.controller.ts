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

// 2. Obtener episodio por ID
export const obtenerEpisodioPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const episodio = await radioModel.obtenerEpisodioPorIdDB(Number(id));

    if (!episodio) {
      return res.status(404).json({ mensaje: 'Episodio no encontrado' });
    }

    return res.status(200).json(episodio);
  } catch (error) {
    console.error('Error al obtener el episodio:', error);
    return res.status(500).json({ mensaje: 'Error al obtener el episodio' });
  }
};

// 3. Crear episodio (Exportación explícita)
export const crearEpisodio = async (req: Request, res: Response) => {
  try {
    const { titulo, audio_url, descripcion, programa } = req.body;

    if (!titulo || !audio_url) {
      return res.status(400).json({ mensaje: 'El título y la URL del audio son obligatorios' });
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
    return res.status(500).json({ mensaje: 'Error al crear el episodio' });
  }
};

// 4. Eliminar episodio por ID
export const eliminarEpisodio = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await radioModel.eliminarEpisodioDB(Number(id));
    return res.status(200).json({ mensaje: 'Episodio eliminado con éxito' });
  } catch (error) {
    console.error('Error al eliminar episodio:', error);
    return res.status(500).json({ mensaje: 'Error al eliminar el episodio' });
  }
};

// 5. Sincronizar programas
export const sincronizarProgramas = async (req: Request, res: Response) => {
  try {
    const programasScraped = await sincronizarRadioSabato();
    const episodiosExistentes = await radioModel.obtenerTodosEpisodiosDB();

    let agregados = 0;

    for (const prog of programasScraped) {
      const existe = episodiosExistentes.some((e: any) => e.audio_url === prog.audio_url);

      if (!existe) {
        await radioModel.crearEpisodioDB(
          prog.titulo,
          prog.audio_url,
          prog.descripcion,
          prog.programa
        );
        agregados++;
      }
    }

    return res.status(200).json({
      mensaje: 'Sincronización completada con éxito',
      agregados,
    });
  } catch (error) {
    console.error('Error al sincronizar programas:', error);
    return res.status(500).json({ mensaje: 'Error al sincronizar programas de radio' });
  }
};