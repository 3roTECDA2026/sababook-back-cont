// src/controllers/metaLectura.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { TipoRol } from '@prisma/client';
import {
  crearMeta,
  obtenerMetasPorUsuario,
  eliminarMeta,
  obtenerTodasLasMetas,
  actualizarMeta,
} from '../models/metaLectura.model';

class MetaLecturaController {
  async crear(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.userId;
      if (!usuarioId) {
        return res.status(401).json({ mensaje: 'Usuario no autenticado' });
      }

      const { periodo_nombre, cantidad_libros, fecha_inicio, fecha_fin } = req.body;

      if (!periodo_nombre || !cantidad_libros || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({ mensaje: 'Faltan campos obligatorios para crear la meta' });
      }

      const nuevaMeta = await crearMeta({
        usuario_id: usuarioId,
        periodo_nombre: String(periodo_nombre).trim(),
        cantidad_libros: parseInt(String(cantidad_libros), 10),
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

  async obtenerMisMetas(req: AuthRequest, res: Response) {
    try {
      // Si pasa usuarioId por URL, solo un docente o administrador puede consultar metas ajenas
      const requestedUserId = req.params.usuarioId ? parseInt(String(req.params.usuarioId), 10) : undefined;
      const targetUserId =
        requestedUserId &&
        requestedUserId !== req.userId &&
        (req.userRole === TipoRol.DOCENTE || req.userRole === TipoRol.ADMINISTRADOR)
          ? requestedUserId
          : req.userId;

      if (!targetUserId) {
        return res.status(401).json({ mensaje: 'Usuario no autenticado' });
      }

      const metas = await obtenerMetasPorUsuario(targetUserId);
      res.json(metas);
    } catch (error) {
      console.error('Error al obtener metas de lectura:', error);
      res.status(500).json({ mensaje: 'Error al obtener las metas' });
    }
  }

  async obtenerTodas(req: AuthRequest, res: Response) {
    try {
      if (req.userRole !== TipoRol.DOCENTE && req.userRole !== TipoRol.ADMINISTRADOR) {
        return res.status(403).json({ mensaje: 'Acceso denegado: se requiere rol docente o administrador' });
      }

      const metas = await obtenerTodasLasMetas();
      res.json(metas);
    } catch (error) {
      console.error('Error al obtener todas las metas:', error);
      res.status(500).json({ mensaje: 'Error al obtener todas las metas' });
    }
  }

  async actualizar(req: AuthRequest, res: Response) {
    try {
      const metaId = parseInt(String(req.params.id), 10);
      const { cantidad_libros, periodo_nombre, fecha_inicio, fecha_fin } = req.body;

      if (!metaId || isNaN(metaId)) {
        return res.status(400).json({ mensaje: 'ID de meta no especificado o inválido' });
      }

      const datosActualizar: Record<string, unknown> = {};
      if (cantidad_libros) datosActualizar.cantidad_libros = parseInt(String(cantidad_libros), 10);
      if (periodo_nombre) datosActualizar.periodo_nombre = String(periodo_nombre).trim();
      if (fecha_inicio) datosActualizar.fecha_inicio = new Date(fecha_inicio);
      if (fecha_fin) datosActualizar.fecha_fin = new Date(fecha_fin);

      const metaActualizada = await actualizarMeta(metaId, datosActualizar);

      res.json({
        mensaje: 'Meta actualizada correctamente',
        meta: metaActualizada,
      });
    } catch (error) {
      console.error('Error al actualizar la meta:', error);
      res.status(500).json({ mensaje: 'Error al actualizar la meta' });
    }
  }

  async eliminar(req: AuthRequest, res: Response) {
    try {
      const metaId = parseInt(String(req.params.id), 10);

      if (!metaId || isNaN(metaId)) {
        return res.status(400).json({ mensaje: 'ID de meta no especificado o inválido' });
      }

      const eliminado = await eliminarMeta(metaId);

      if (!eliminado) {
        return res.status(404).json({ mensaje: 'Meta no encontrada' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error al eliminar meta:', error);
      res.status(500).json({ mensaje: 'Error al eliminar la meta' });
    }
  }
}

export default new MetaLecturaController();