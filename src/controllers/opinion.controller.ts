// src/controllers/opinion.controller.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { opinionModel } from '../models/opinion.model';
import { medalModel } from '../models/medal.model';
import leoProfanity from 'leo-profanity';

// Inicializamos los diccionarios de malas palabras
leoProfanity.loadDictionary('en');
leoProfanity.loadDictionary('es');

leoProfanity.add(['mierda', 'pelotudo', 'boludo', 'Estupido']);

class OpinionController {
  async getAllOpinions(req: Request, res: Response) {
    try {
      const opinions = await opinionModel.getAllOpinions();
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

      const opinion = await opinionModel.getOpinionById(opinionId);
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

      // Moderación automática
      const comentarioLimpio = leoProfanity.clean(comentario);

      const newOpinion = await opinionModel.createOpinion({
        usuario_id,
        libro_id,
        calificacion,
        comentario: comentarioLimpio,
      });

      console.log(newOpinion);

      // Verificar y asignar medallas después de crear el comentario del usuario
      await medalModel.verificarYAsignarMedallas(usuario_id);

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

      const existingOpinion = await opinionModel.getOpinionById(opinionId);
      if (!existingOpinion) {
        return res.status(404).json({ error: 'Opinion not found' });
      }

      // Verifica permisos: solo autor o admin
      const userId = req.userId;
      const userRole = req.userRole;

      if (userRole !== 3 && userId !== existingOpinion.usuario_id) {
        return res.status(403).json({ error: 'Not authorized to modify this opinion' });
      }

      // Limpiar comentario si viene texto nuevo
      const updatedFields = req.body;
      if (updatedFields.comentario) {
        updatedFields.comentario = leoProfanity.clean(updatedFields.comentario);
      }

      const updatedOpinion = await opinionModel.updateOpinion(opinionId, updatedFields);
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

      const existingOpinion = await opinionModel.getOpinionById(opinionId);
      if (!existingOpinion) {
        return res.status(404).json({ error: 'Opinion not found' });
      }

      // Solo el autor o admin pueden borrar
      const userId = req.userId;
      const userRole = req.userRole;

      if (userRole !== 3 && userId !== existingOpinion.usuario_id) {
        return res.status(403).json({ error: 'Not authorized to delete this opinion' });
      }

      await opinionModel.deleteOpinion(opinionId);
      return res.status(204).end();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error deleting opinion:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getOpinionsByLibro(req: Request, res: Response) {
    try {
      const libroId = parseInt(String(req.params.libro_id), 10);
      if (isNaN(libroId)) {
        return res.status(400).json({ error: 'Invalid libro ID' });
      }

      const sqlOpinions = await opinionModel.getOpinionsByLibro(libroId);
      return res.status(200).json(sqlOpinions);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error getting opinions by libro:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new OpinionController();