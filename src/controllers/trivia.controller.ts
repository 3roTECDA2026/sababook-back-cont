// src/controllers/trivia.controller.ts
import { Request, Response } from 'express';
import { triviaModel, CreateTriviaData } from '../models/trivia.model';

class TriviaController {
  async getByLibro(req: Request, res: Response) {
    try {
      const libroId = parseInt(String(req.params.libroId), 10);
      if (isNaN(libroId)) {
        return res.status(400).json({ error: 'Invalid libro ID' });
      }

      const questions = await triviaModel.getByLibro(libroId);
      return res.status(200).json(questions);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error getting trivia by libro:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const {
        libro_id,
        evaluacion_id,
        modo,
        formato,
        pregunta,
        fechaLimite,
        opciones,
        correcta,
        pares,
        texto,
        respuestas,
      } = req.body;

      if (!libro_id || !modo || !formato) {
        return res.status(400).json({ error: 'Missing required fields: libro_id, modo, formato' });
      }

      if (!['trivia', 'evaluacion'].includes(modo)) {
        return res.status(400).json({ error: 'modo must be trivia or evaluacion' });
      }
      if (!['multiple', 'truefalse', 'conexion', 'completar'].includes(formato)) {
        return res.status(400).json({ error: 'formato must be multiple, truefalse, conexion, or completar' });
      }

      if (formato === 'multiple' || formato === 'truefalse') {
        if (!opciones || !Array.isArray(opciones) || opciones.length < 2) {
          return res.status(400).json({ error: 'At least 2 opciones are required for multiple/truefalse' });
        }
        if (correcta === undefined || correcta < 0 || correcta >= opciones.length) {
          return res.status(400).json({ error: 'correcta must be a valid option index' });
        }
      }
      if (formato === 'conexion') {
        if (!pares || !Array.isArray(pares) || pares.length < 2) {
          return res.status(400).json({ error: 'At least 2 pares are required for conexion format' });
        }
      }
      if (formato === 'completar') {
        if (!texto || !String(texto).trim()) {
          return res.status(400).json({ error: 'texto is required for completar format' });
        }
        if (!respuestas || !Array.isArray(respuestas) || respuestas.length === 0) {
          return res.status(400).json({ error: 'At least 1 respuesta is required for completar format' });
        }
      }

      const data: CreateTriviaData = {
        libro_id,
        evaluacion_id,
        modo,
        formato,
        pregunta,
        fechaLimite: fechaLimite || null,
        opciones: opciones || [],
        correcta: correcta ?? -1,
        pares: pares || [],
        texto: texto || '',
        respuestas: respuestas || [],
      };

      const newQuestion = await triviaModel.create(data);
      return res.status(201).json(newQuestion);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error creating trivia question:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const preguntaId = parseInt(String(req.params.preguntaId), 10);
      if (isNaN(preguntaId)) {
        return res.status(400).json({ error: 'Invalid pregunta ID' });
      }

      await triviaModel.delete(preguntaId);
      return res.status(204).end();
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error deleting trivia question:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getEvaluacionesByLibro(req: Request, res: Response) {
    try {
      const libroId = parseInt(String(req.params.libroId), 10);
      if (isNaN(libroId)) {
        return res.status(400).json({ error: 'Invalid libro ID' });
      }

      const evaluaciones = await triviaModel.getEvaluacionesByLibro(libroId);
      return res.status(200).json(evaluaciones);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error getting evaluaciones:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createEvaluacion(req: Request, res: Response) {
    try {
      const { libro_id, fecha_limite } = req.body;

      if (!libro_id) {
        return res.status(400).json({ error: 'Missing required field: libro_id' });
      }

      const nuevaEvaluacion = await triviaModel.createEvaluacion(libro_id, fecha_limite);
      return res.status(201).json(nuevaEvaluacion);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error creating evaluacion:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getEvaluacionById(req: Request, res: Response) {
    try {
      const evaluacionId = parseInt(String(req.params.evaluacionId), 10);
      if (isNaN(evaluacionId)) {
        return res.status(400).json({ error: 'Invalid evaluacion ID' });
      }

      const detail = await triviaModel.getEvaluacionById(evaluacionId);
      if (!detail) {
        return res.status(404).json({ error: 'Evaluacion not found' });
      }

      return res.status(200).json(detail);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error getting evaluacion by ID:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new TriviaController();