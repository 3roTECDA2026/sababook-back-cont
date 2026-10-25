// src/controllers/comentario.controller.ts
import { Request, Response } from 'express';
import {
  insertarComentario,
  obtenerComentariosPorForo,
  obtenerTodosComentarios,
  obtenerComentarioPorId,
  actualizarComentarioPorId,
  eliminarComentarioPorId,
} from '../models/comment.model';
import { medalModel } from '../models/medal.model';
import { obtenerForoConComentariosDB } from '../models/foro.model';

export const crearComentario = async (req: Request, res: Response) => {
  try {
    const foro_id = parseInt(String(req.params.id)); // Foro ID desde la URL
    const { usuario_id, contenido } = req.body;

    const nuevoComentario = await insertarComentario(foro_id, usuario_id, contenido);

    // Asignar medallas si aplica
    await medalModel.verificarYAsignarMedallas(usuario_id);

    // Obtener el comentario completo desde la DB
    const foroConComentarios = await obtenerForoConComentariosDB(foro_id);
    const comentarioCompleto = foroConComentarios?.comentarios.find(
      (c) => c.comentario_id === nuevoComentario.comentario_id
    );

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
    let comentarios;
    if (req.params.foro_id) {
      comentarios = await obtenerComentariosPorForo(parseInt(String(req.params.foro_id)));
    } else {
      comentarios = await obtenerTodosComentarios();
    }
    res.json(comentarios);
  } catch (error) {
    console.error('❌ Error al obtener comentarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener los comentarios' });
  }
};

export const obtenerComentario = async (req: Request, res: Response) => {
  try {
    const comentario = await obtenerComentarioPorId(parseInt(String(req.params.id)));
    if (!comentario) return res.status(404).json({ mensaje: 'Comentario no encontrado' });
    res.json(comentario);
  } catch (error) {
    console.error('❌ Error al obtener comentario:', error);
    res.status(500).json({ mensaje: 'Error al obtener el comentario' });
  }
};

export const actualizarComentario = async (req: Request, res: Response) => {
  try {
    const comentarioActualizado = await actualizarComentarioPorId(parseInt(String(req.params.id)), req.body.contenido);
    if (!comentarioActualizado) return res.status(404).json({ mensaje: 'Comentario no encontrado' });
    res.json({ mensaje: 'Comentario actualizado correctamente' });
  } catch (error) {
    console.error('❌ Error al actualizar comentario:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el comentario' });
  }
};

export const eliminarComentario = async (req: Request, res: Response) => {
  try {
    const comentarioEliminado = await eliminarComentarioPorId(parseInt(String(req.params.id)));
    if (!comentarioEliminado) return res.status(404).json({ mensaje: 'Comentario no encontrado' });
    res.json({ mensaje: 'Comentario eliminado correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar comentario:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el comentario' });
  }
};