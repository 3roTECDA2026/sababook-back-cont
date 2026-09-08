// src/controllers/foro.controller.ts
import { Request, Response } from 'express';
import { forumService } from '../services/forum.service';

// Crear un foro
export const crearForo = async (req: Request, res: Response) => {
  try {
    console.log('🟡 Datos recibidos desde frontend:', req.body);
    const { titulo, descripcion, creador_id } = req.body;
    const nuevoForo = await forumService.crearForo(titulo, descripcion, creador_id);
    res.status(201).json({ foro_id: nuevoForo.foro_id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Error al crear foro:', error);
    res.status(500).json({ mensaje: 'Error al crear el foro', detalle: message });
  }
};

// Obtener todos los foros
export const obtenerForos = async (req: Request, res: Response) => {
  try {
    const foros = await forumService.obtenerTodosForos();
    res.json(foros);
  } catch (error) {
    console.error('❌ Error al obtener foros:', error);
    res.status(500).json({ mensaje: 'Error al obtener los foros' });
  }
};

// Obtener un foro por ID
export const obtenerForo = async (req: Request, res: Response) => {
  try {
    const foro_id = parseInt(String(req.params.id), 10);
    const foro = await forumService.obtenerForoPorId(foro_id);

    if (!foro) {
      return res.status(404).json({ mensaje: 'Foro no encontrado' });
    }

    res.json(foro);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ ERROR REAL:', error);
    res.status(500).json({
      mensaje: 'Error al obtener el foro',
      detalle: message,
    });
  }
};

// Actualizar un foro
export const actualizarForo = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const { titulo, descripcion } = req.body;
    const foroActualizado = await forumService.actualizarForo(id, titulo, descripcion);

    if (!foroActualizado) return res.status(404).json({ mensaje: 'Foro no encontrado' });

    res.json({ mensaje: 'Foro actualizado correctamente' });
  } catch (error) {
    console.error('❌ Error al actualizar foro:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el foro' });
  }
};

// Eliminar un foro
export const eliminarForo = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const foroEliminado = await forumService.eliminarForo(id);

    if (!foroEliminado) return res.status(404).json({ mensaje: 'Foro no encontrado' });

    res.json({ mensaje: 'Foro eliminado correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar foro:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el foro' });
  }
};

// Obtener foro con comentarios
export const obtenerForoConComentarios = async (req: Request, res: Response) => {
  try {
    const foro_id = parseInt(String(req.params.id), 10);
    const foroConComentarios = await forumService.obtenerForoConComentarios(foro_id);

    if (!foroConComentarios) return res.status(404).json({ mensaje: 'Foro no encontrado' });

    res.json(foroConComentarios);
  } catch (error) {
    console.error('❌ Error al obtener foro con comentarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener foro con comentarios' });
  }
};