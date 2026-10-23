// src/controllers/racha.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import RachaService from '../services/racha.service';

export class RachaController {
  static async obtenerRacha(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.user?.usuario_id || req.user?.id;
      if (!usuarioId) {
        return res.status(401).json({ mensaje: 'No autorizado' });
      }

      const estado = await RachaService.obtenerRacha(Number(usuarioId));
      return res.status(200).json(estado);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error al obtener la racha';
      return res.status(500).json({ mensaje });
    }
  }

  static async registrarLectura(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.user?.usuario_id || req.user?.id;
      if (!usuarioId) {
        return res.status(401).json({ mensaje: 'No autorizado' });
      }

      const nuevoEstado = await RachaService.registrarLectura(Number(usuarioId));
      return res.status(200).json(nuevoEstado);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error al registrar lectura para racha';
      return res.status(500).json({ mensaje });
    }
  }
}

export default RachaController;
