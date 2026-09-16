// src/controllers/metaLectura.controller.ts
import { Request, Response } from 'express';
import { crearMeta, obtenerMetasPorUsuario, eliminarMeta } from '../models/metaLectura.model';

// Interfaz para extender Request cuando el middleware de autenticación inyecta el usuario
interface AuthenticatedRequest extends Request {
  user?: {
    usuario_id: number;
  };
}

class MetaLecturaController {
  async crear(req: AuthenticatedRequest, res: Response) {
    try {
      const usuarioId = req.user?.usuario_id || req.body.usuario_id;
      const { periodo_nombre, cantidad_libros, fecha_inicio, fecha_fin } = req.body;

      if (!usuarioId || !periodo_nombre || !cantidad_libros || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({ mensaje: 'Faltan campos obligatorios para crear la meta' });
      }

      const nuevaMeta = await crearMeta({
        usuario_id: parseInt(String(usuarioId)),
        periodo_nombre,
        cantidad_libros: parseInt(String(cantidad_libros)),
        fecha_inicio: new Date(fecha_inicio),
        fecha_fin: new Date(fecha_fin),
      });

      res.status(201).json({
        mensaje: 'Meta de lectura creada correctamente',
        meta: nuevaMeta,
      });
    } catch (error) {
      console.error('Error al crear meta de lectura:', error);
      res.status(500).json({ mensaje: 'Error interno al crear la meta' });
    }
  }

  async obtenerMisMetas(req: AuthenticatedRequest, res: Response) {
    try {
      const usuarioId = req.user?.usuario_id || parseInt(String(req.params.usuarioId));

      if (!usuarioId) {
        return res.status(400).json({ mensaje: 'ID de usuario no especificado' });
      }

      const metas = await obtenerMetasPorUsuario(usuarioId);
      res.json(metas);
    } catch (error) {
      console.error('Error al obtener metas de lectura:', error);
      res.status(500).json({ mensaje: 'Error al obtener las metas' });
    }
  }

  async eliminar(req: AuthenticatedRequest, res: Response) {
    try {
      const metaId = parseInt(String(req.params.id));
      const usuarioId = req.user?.usuario_id || req.body.usuario_id;

      const eliminado = await eliminarMeta(metaId, usuarioId);

      if (!eliminado) {
        return res.status(404).json({ mensaje: 'Meta no encontrada o no pertenece al usuario' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error al eliminar meta:', error);
      res.status(500).json({ mensaje: 'Error al eliminar la meta' });
    }
  }
}

export default new MetaLecturaController();