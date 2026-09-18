// src/controllers/feed.controller.ts
import { Response } from 'express';
import { feedService } from '../services/feed.service';
import { AuthRequest } from '../middleware/auth.middleware';

const obtenerFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;

    const resultado = await feedService.obtenerFeed(page, limit);

    res.status(200).json({
      total: resultado.total,
      pagina: page,
      limite: limit,
      actividades: resultado.actividades,
    });
  } catch (error) {
    console.error('Error al obtener el feed de actividades:', error);
    res.status(500).json({ error: 'Error interno al consultar el feed de actividades.' });
  }
};

export default obtenerFeed;