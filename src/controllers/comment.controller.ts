// src/controllers/comment.controller.ts
import { Request, Response } from 'express';
import { commentService } from '../services/comment.service';

export const crearComentario = async (req: Request, res: Response) => {
  try {
    const foro_id = parseInt(String(req.params.id), 10);
    const { usuario_id, contenido } = req.body;

    const comentarioCompleto = await commentService.crearComentario(foro_id, usuario_id, contenido);

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

export const obtenerComentarios = async (req: Request, res: Response) => {
  try {
    const foroId = req.params.foro_id ? parseInt(String(req.params.foro_id), 10) : undefined;
    const comentarios = await commentService.obtenerComentarios(foroId);
    res.json(comentarios);
  } catch (error) {
    console.error('❌ Error al obtener comentarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener los comentarios' });
  }
};

export const obtenerComentario = async (req: Request, res: Response) => {
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

export const actualizarComentario = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const comentarioActualizado = await commentService.actualizarComentario(id, req.body.contenido);
    if (!comentarioActualizado) return res.status(404).json({ mensaje: 'Comentario no encontrado' });
    res.json({ mensaje: 'Comentario actualizado correctamente' });
  } catch (error) {
    console.error('❌ Error al actualizar comentario:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el comentario' });
  }
};

export const eliminarComentario = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const comentarioEliminado = await commentService.eliminarComentario(id);
    if (!comentarioEliminado) return res.status(404).json({ mensaje: 'Comentario no encontrado' });
    res.json({ mensaje: 'Comentario eliminado correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar comentario:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el comentario' });
  }
};