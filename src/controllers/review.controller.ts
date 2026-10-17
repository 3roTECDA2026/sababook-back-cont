
// src/controllers/review.controller.ts

import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { reviewService } from '../services/review.service';
import { validarComentarioOpinion } from '../services/opinion-content.service';
import { TipoRol } from '@prisma/client';

class ReviewController {

  // =====================================================
  // OBTENER TODAS LAS OPINIONES
  // =====================================================
  async getAllOpinions(req: Request, res: Response) {
    try {
      const opinions = await reviewService.getAllOpinions();

      return res.status(200).json(opinions);
    } catch (error) {
      console.error('Error al obtener opiniones:', error);

      return res.status(500).json({
        error: 'No se pudieron obtener las opiniones.',
      });
    }
  }

  // =====================================================
  // OBTENER UNA OPINIÓN POR ID
  // =====================================================
  async getOpinionById(req: Request, res: Response) {
    try {
      const opinionId = Number(req.params.id);

      if (!Number.isInteger(opinionId) || opinionId <= 0) {
        return res.status(400).json({
          error: 'ID de opinión inválido.',
        });
      }

      const opinion = await reviewService.getOpinionById(opinionId);

      if (!opinion) {
        return res.status(404).json({
          error: 'Opinión no encontrada.',
        });
      }

      return res.status(200).json(opinion);
    } catch (error) {
      console.error('Error al obtener opinión:', error);

      return res.status(500).json({
        error: 'No se pudo obtener la opinión.',
      });
    }
  }

  // =====================================================
  // CREAR OPINIÓN / COMENTARIO GENERAL
  // =====================================================
  async createOpinion(req: AuthRequest, res: Response) {
    try {
      // El usuario se identifica mediante el token JWT.
      const usuario_id = req.userId;

      const { libro_id, calificacion, comentario } = req.body;

      if (!usuario_id) {
        return res.status(401).json({
          error: 'Usuario no autenticado.',
        });
      }

      const libroId = Number(libro_id);
      const rating = Number(calificacion);

      if (!Number.isInteger(libroId) || libroId <= 0) {
        return res.status(400).json({
          error: 'El ID del libro es inválido.',
        });
      }

      if (
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
      ) {
        return res.status(400).json({
          error: 'La calificación debe estar entre 1 y 5.',
        });
      }

      if (typeof comentario !== 'string' || !comentario.trim()) {
        return res.status(400).json({
          error: 'Debés escribir un comentario.',
        });
      }

      const comentarioLimpio = comentario.trim();

      // Validación de longitud y contenido.
      const validacion = validarComentarioOpinion(comentarioLimpio);

      if (!validacion.valido) {
        return res.status(400).json({
          error: validacion.error,
        });
      }

      // Guardar mediante el servicio y Prisma.
      const nuevaOpinion = await reviewService.createOpinion({
        usuario_id,
        libro_id: libroId,
        calificacion: rating,
        comentario: comentarioLimpio,
      });

      return res.status(201).json(nuevaOpinion);
    } catch (error) {
      console.error('Error al crear opinión:', error);

      return res.status(500).json({
        error: 'No se pudo guardar el comentario.',
      });
    }
  }

  // =====================================================
  // ACTUALIZAR OPINIÓN
  // =====================================================
  async updateOpinion(req: AuthRequest, res: Response) {
    try {
      const opinionId = Number(req.params.id);

      if (!Number.isInteger(opinionId) || opinionId <= 0) {
        return res.status(400).json({
          error: 'ID de opinión inválido.',
        });
      }

      const existingOpinion =
        await reviewService.getOpinionById(opinionId);

      if (!existingOpinion) {
        return res.status(404).json({
          error: 'Opinión no encontrada.',
        });
      }

      const userId = req.userId;
      const userRole = req.userRole;

      if (!userId) {
        return res.status(401).json({
          error: 'Usuario no autenticado.',
        });
      }

      // Solamente el administrador o el autor.
      if (
        userRole !== TipoRol.ADMINISTRADOR &&
        userId !== existingOpinion.usuario_id
      ) {
        return res.status(403).json({
          error: 'No tenés permisos para modificar esta opinión.',
        });
      }

      const updatedFields: {
        comentario?: string;
        calificacion?: number;
      } = {};

      if (req.body.comentario !== undefined) {
        if (typeof req.body.comentario !== 'string') {
          return res.status(400).json({
            error: 'El comentario debe ser un texto.',
          });
        }

        const comentario = req.body.comentario.trim();

        const validacion = validarComentarioOpinion(comentario);

        if (!validacion.valido) {
          return res.status(400).json({
            error: validacion.error,
          });
        }

        updatedFields.comentario = comentario;
      }

      if (req.body.calificacion !== undefined) {
        const rating = Number(req.body.calificacion);

        if (
          !Number.isInteger(rating) ||
          rating < 1 ||
          rating > 5
        ) {
          return res.status(400).json({
            error: 'La calificación debe estar entre 1 y 5.',
          });
        }

        updatedFields.calificacion = rating;
      }

      if (Object.keys(updatedFields).length === 0) {
        return res.status(400).json({
          error: 'No se enviaron datos para actualizar.',
        });
      }

      const updatedOpinion = await reviewService.updateOpinion(
        opinionId,
        updatedFields
      );

      return res.status(200).json(updatedOpinion);
    } catch (error) {
      console.error('Error al actualizar opinión:', error);

      return res.status(500).json({
        error: 'No se pudo actualizar la opinión.',
      });
    }
  }

  // =====================================================
  // ELIMINAR OPINIÓN
  // =====================================================
  async deleteOpinion(req: AuthRequest, res: Response) {
    try {
      const opinionId = Number(req.params.id);

      if (!Number.isInteger(opinionId) || opinionId <= 0) {
        return res.status(400).json({
          error: 'ID de opinión inválido.',
        });
      }

      const existingOpinion =
        await reviewService.getOpinionById(opinionId);

      if (!existingOpinion) {
        return res.status(404).json({
          error: 'Opinión no encontrada.',
        });
      }

      const userId = req.userId;
      const userRole = req.userRole;

      if (!userId) {
        return res.status(401).json({
          error: 'Usuario no autenticado.',
        });
      }

      // Solamente el administrador o el autor.
      if (
        userRole !== TipoRol.ADMINISTRADOR &&
        userId !== existingOpinion.usuario_id
      ) {
        return res.status(403).json({
          error: 'No tenés permisos para eliminar esta opinión.',
        });
      }

      await reviewService.deleteOpinion(opinionId);

      return res.status(204).end();
    } catch (error) {
      console.error('Error al eliminar opinión:', error);

      return res.status(500).json({
        error: 'No se pudo eliminar la opinión.',
      });
    }
  }

  // =====================================================
  // OBTENER OPINIONES DE UN LIBRO
  // =====================================================
  async getOpinionsByLibro(req: Request, res: Response) {
    try {
      const libroIdParam =
        req.params.bookId || req.params.libro_id;

      const libroId = Number(libroIdParam);

      if (!Number.isInteger(libroId) || libroId <= 0) {
        return res.status(400).json({
          error: 'ID de libro inválido.',
        });
      }

      const opiniones =
        await reviewService.getOpinionsByLibro(libroId);

      return res.status(200).json(opiniones);
    } catch (error) {
      console.error('Error al obtener opiniones del libro:', error);

      return res.status(500).json({
        error: 'No se pudieron obtener los comentarios del libro.',
      });
    }
  }
}

export default new ReviewController();
