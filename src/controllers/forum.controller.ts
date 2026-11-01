// src/controllers/foro.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { forumService } from '../services/forum.service';
import { TipoRol } from '@prisma/client';
import { getStringParam, QueryParamError } from '../utils/queryParams';
import { MAX_SEARCH_LENGTH } from '../utils/search';

// Crear un foro (soporta foros estándar, debates APL y vinculación con Radio Sábato)
export const crearForo = async (req: AuthRequest, res: Response) => {
  try {
    const creador_id = req.userId;
    if (!creador_id) {
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
    }

    const { titulo, descripcion, es_apl, episodio_id } = req.body;

    if (!titulo || typeof titulo !== 'string' || !titulo.trim()) {
      return res.status(400).json({ mensaje: 'El título del foro es obligatorio' });
    }

    const nuevoForo = await forumService.crearForo(
      titulo.trim(),
      descripcion ? String(descripcion).trim() : '',
      creador_id,
      Boolean(es_apl),
      episodio_id ? parseInt(String(episodio_id), 10) : undefined
    );

    res.status(201).json({ foro_id: nuevoForo.foro_id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Error al crear foro:', error);
    res.status(500).json({ mensaje: 'Error al crear el foro', detalle: message });
  }
};

// Obtener todos los foros
export const obtenerForos = async (req: AuthRequest, res: Response) => {
  try {
    // SAB-122: búsqueda por título o descripción
    const q = getStringParam(req.query, 'q');
    if (q && q.length > MAX_SEARCH_LENGTH) {
      return res
        .status(400)
        .json({ mensaje: `La búsqueda no puede superar los ${MAX_SEARCH_LENGTH} caracteres.` });
    }

    const foros = await forumService.obtenerTodosForos(q);
    res.json(foros);
  } catch (error) {
    if (error instanceof QueryParamError) {
      return res.status(400).json({ mensaje: error.message });
    }
    console.error('❌ Error al obtener foros:', error);
    res.status(500).json({ mensaje: 'Error al obtener los foros' });
  }
};

// Obtener un foro por ID
export const obtenerForo = async (req: AuthRequest, res: Response) => {
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
export const actualizarForo = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
    }

    const id = parseInt(String(req.params.id), 10);
    const foroExistente = await forumService.obtenerForoPorId(id);
    if (!foroExistente) return res.status(404).json({ mensaje: 'Foro no encontrado' });

    // Solo el creador o un administrador pueden actualizar el foro
    if (foroExistente.creador_id !== userId && req.userRole !== TipoRol.ADMINISTRADOR) {
      return res.status(403).json({ mensaje: 'No tienes permiso para modificar este foro' });
    }

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
export const eliminarForo = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
    }

    const id = parseInt(String(req.params.id), 10);
    const foroExistente = await forumService.obtenerForoPorId(id);
    if (!foroExistente) return res.status(404).json({ mensaje: 'Foro no encontrado' });

    // Solo el creador o un administrador pueden eliminar el foro
    if (foroExistente.creador_id !== userId && req.userRole !== TipoRol.ADMINISTRADOR) {
      return res.status(403).json({ mensaje: 'No tienes permiso para eliminar este foro' });
    }

    const foroEliminado = await forumService.eliminarForo(id);
    if (!foroEliminado) return res.status(404).json({ mensaje: 'Foro no encontrado' });

    res.json({ mensaje: 'Foro eliminado correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar foro:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el foro' });
  }
};

// Obtener foro con comentarios
export const obtenerForoConComentarios = async (req: AuthRequest, res: Response) => {
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