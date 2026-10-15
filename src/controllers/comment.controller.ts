// src/controllers/comment.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { commentService } from '../services/comment.service';
import { TipoRol } from '@prisma/client';

export const crearComentario = async (req: AuthRequest, res: Response) => {
  try {
    const usuario_id = req.userId;
    if (!usuario_id) {
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
    }

    const foro_id = parseInt(String(req.params.id || req.body.foro_id), 10);
    if (!foro_id || isNaN(foro_id)) {
      return res.status(400).json({ mensaje: 'ID de foro inválido o faltante' });
    }

    const { contenido } = req.body;
    if (!contenido || typeof contenido !== 'string' || !contenido.trim()) {
      return res.status(400).json({ mensaje: 'El contenido del comentario es obligatorio' });
    }

    const comentarioCompleto = await commentService.crearComentario(foro_id, usuario_id, contenido.trim());

    res.status(201).json(comentarioCompleto);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Error al crear comentario:', error);
    res.status(500).json({
      mensaje: 'Error al crear el comentario',
      detalle: message,
    });
  }
};

export const obtenerComentarios = async (req: AuthRequest, res: Response) => {
  try {
    const foroId = req.params.foro_id ? parseInt(String(req.params.foro_id), 10) : undefined;
    const comentarios = await commentService.obtenerComentarios(foroId);
    res.json(comentarios);
  } catch (error) {
    console.error('❌ Error al obtener comentarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener los comentarios' });
  }
};

export const obtenerComentario = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const comentario = await commentService.obtenerComentarioPorId(id);
    if (!comentario) return res.status(404).json({ mensaje: 'Comentario no encontrado' });
    res.json(comentario);
  } catch (error) {
    console.error('❌ Error al obtener comentario:', error);
    res.status(500).json({ mensaje: 'Error al obtener el comentario' });
  }
};

export const actualizarComentario = async (req: AuthRequest, res: Response) => {
  try {
    const usuario_id = req.userId;
    if (!usuario_id) {
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
    }

    const id = parseInt(String(req.params.id), 10);
    const comentario = await commentService.obtenerComentarioPorId(id);
    if (!comentario) return res.status(404).json({ mensaje: 'Comentario no encontrado' });

    // Solo el autor o un administrador pueden editarlo
    if (comentario.usuario_id !== usuario_id && req.userRole !== TipoRol.ADMINISTRADOR) {
      return res.status(403).json({ mensaje: 'No tienes permiso para modificar este comentario' });
    }

    const { contenido } = req.body;
    if (!contenido || typeof contenido !== 'string' || !contenido.trim()) {
      return res.status(400).json({ mensaje: 'El contenido del comentario es obligatorio' });
    }

    const comentarioActualizado = await commentService.actualizarComentario(id, contenido.trim());
    if (!comentarioActualizado) return res.status(404).json({ mensaje: 'Comentario no encontrado' });
    res.json({ mensaje: 'Comentario actualizado correctamente' });
  } catch (error) {
    console.error('❌ Error al actualizar comentario:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el comentario' });
  }
};

export const eliminarComentario = async (req: AuthRequest, res: Response) => {
  try {
    const usuario_id = req.userId;
    if (!usuario_id) {
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
    }

    const id = parseInt(String(req.params.id), 10);
    const comentario = await commentService.obtenerComentarioPorId(id);
    if (!comentario) return res.status(404).json({ mensaje: 'Comentario no encontrado' });

    // Solo el autor o un administrador pueden eliminarlo
    if (comentario.usuario_id !== usuario_id && req.userRole !== TipoRol.ADMINISTRADOR) {
      return res.status(403).json({ mensaje: 'No tienes permiso para eliminar este comentario' });
    }

    const comentarioEliminado = await commentService.eliminarComentario(id);
    if (!comentarioEliminado) return res.status(404).json({ mensaje: 'Comentario no encontrado' });
    res.json({ mensaje: 'Comentario eliminado correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar comentario:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el comentario' });
  }
};