// src/controllers/racha.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import RachaService from '../services/racha.service';

export class RachaController {
  static async obtenerRacha(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.userId;
      if (!usuarioId) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const estado = await RachaService.obtenerRacha(Number(usuarioId));
      return res.status(200).json(estado);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error al obtener la racha';
      const status = mensaje === 'Usuario no encontrado' ? 404 : 500;
      return res.status(status).json({ error: mensaje });
    }
  }

  static async registrarLectura(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.userId;
      if (!usuarioId) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const nuevoEstado = await RachaService.registrarLectura(Number(usuarioId));
      return res.status(200).json(nuevoEstado);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error al registrar lectura para racha';
      const status = mensaje === 'Usuario no encontrado' ? 404 : 500;
      return res.status(status).json({ error: mensaje });
    }
  }
}

export default RachaController;
