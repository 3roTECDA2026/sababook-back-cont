// src/controllers/review.controller.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { reviewService } from '../services/review.service';

class ReviewController {
  async getAllOpinions(req: Request, res: Response) {
    try {
      const opinions = await reviewService.getAllOpinions();
      return res.status(200).json(opinions);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error getting opinions:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getOpinionById(req: Request, res: Response) {
    try {
      const opinionId = parseInt(String(req.params.id), 10);
      if (isNaN(opinionId)) {
        return res.status(400).json({ error: 'Invalid opinion ID' });
      }

      const opinion = await reviewService.getOpinionById(opinionId);
      if (!opinion) {
        return res.status(404).json({ error: 'Opinion not found' });
      }

      return res.status(200).json(opinion);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error getting opinion by ID:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createOpinion(req: Request, res: Response) {
    try {
      const { usuario_id, libro_id, calificacion, comentario } = req.body;

      if (!usuario_id || !libro_id || !calificacion || !comentario) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const newOpinion = await reviewService.createOpinion({
        usuario_id,
        libro_id,
        calificacion,
        comentario,
      });

      return res.status(201).json(newOpinion);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error creating opinion:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateOpinion(req: AuthRequest, res: Response) {
    try {
      const opinionId = parseInt(String(req.params.id), 10);
      if (isNaN(opinionId)) {
        return res.status(400).json({ error: 'Invalid opinion ID' });
      }

      const existingOpinion = await reviewService.getOpinionById(opinionId);
      if (!existingOpinion) {
        return res.status(404).json({ error: 'Opinion not found' });
      }

      // Permisos: admin (rol 3) o dueño de la publicación
      const userId = req.userId;
      const userRole = req.userRole;

      if (userRole !== 3 && userId !== existingOpinion.usuario_id) {
        return res.status(403).json({ error: 'Not authorized to modify this opinion' });
      }

      const updatedFields = req.body;
      const updatedOpinion = await reviewService.updateOpinion(opinionId, updatedFields);
      return res.status(200).json(updatedOpinion);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error updating opinion:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteOpinion(req: AuthRequest, res: Response) {
    try {
      const opinionId = parseInt(String(req.params.id), 10);
      if (isNaN(opinionId)) {
        return res.status(400).json({ error: 'Invalid opinion ID' });
      }

      const existingOpinion = await reviewService.getOpinionById(opinionId);
      if (!existingOpinion) {
        return res.status(404).json({ error: 'Opinion not found' });
      }

      const userId = req.userId;
      const userRole = req.userRole;

      if (userRole !== 3 && userId !== existingOpinion.usuario_id) {
        return res.status(403).json({ error: 'Not authorized to delete this opinion' });
      }

      await reviewService.deleteOpinion(opinionId);
      return res.status(204).end();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error deleting opinion:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getOpinionsByLibro(req: Request, res: Response) {
    try {
      const libroIdParam = req.params.bookId || req.params.libro_id;
      const libroId = parseInt(String(libroIdParam), 10);
      if (isNaN(libroId)) {
        return res.status(400).json({ error: 'Invalid libro ID' });
      }

      const sqlOpinions = await reviewService.getOpinionsByLibro(libroId);
      return res.status(200).json(sqlOpinions);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error getting opinions by libro:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new ReviewController();