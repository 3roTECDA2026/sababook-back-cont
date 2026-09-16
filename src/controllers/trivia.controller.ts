// src/controllers/trivia.controller.ts
import { Request, Response } from 'express';
import { triviaModel, CreateTriviaData } from '../models/trivia.model';

class TriviaController {
  async getByBook(req: Request, res: Response) {
    try {
      const bookId = parseInt(String(req.params.bookId), 10);
      if (isNaN(bookId)) {
        return res.status(400).json({ error: 'Invalid book ID' });
      }

      const questions = await triviaModel.getByBook(bookId);
      return res.status(200).json(questions);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error getting trivia by book:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const {
        bookId,
        evaluationId,
        mode,
        format,
        question,
        deadline,
        options,
        correctAnswer,
        pairs,
        text,
        answers,
      } = req.body;

      if (!bookId || !mode || !format) {
        return res.status(400).json({ error: 'Missing required fields: bookId, mode, format' });
      }

      if (!['trivia', 'evaluacion'].includes(mode)) {
        return res.status(400).json({ error: 'mode must be trivia or evaluacion' });
      }
      if (!['multiple', 'truefalse', 'conexion', 'completar'].includes(format)) {
        return res.status(400).json({ error: 'format must be multiple, truefalse, conexion, or completar' });
      }

      if (format === 'multiple' || format === 'truefalse') {
        if (!options || !Array.isArray(options) || options.length < 2) {
          return res.status(400).json({ error: 'At least 2 options are required for multiple/truefalse' });
        }
        if (correctAnswer === undefined || correctAnswer < 0 || correctAnswer >= options.length) {
          return res.status(400).json({ error: 'correctAnswer must be a valid option index' });
        }
      }
      if (format === 'conexion') {
        if (!pairs || !Array.isArray(pairs) || pairs.length < 2) {
          return res.status(400).json({ error: 'At least 2 pairs are required for conexion format' });
        }
      }
      if (format === 'completar') {
        if (!text || !String(text).trim()) {
          return res.status(400).json({ error: 'text is required for completar format' });
        }
        if (!answers || !Array.isArray(answers) || answers.length === 0) {
          return res.status(400).json({ error: 'At least 1 answer is required for completar format' });
        }
      }

      const data: CreateTriviaData = {
        bookId,
        evaluationId,
        mode,
        format,
        question,
        deadline: deadline || null,
        options: options || [],
        correctAnswer: correctAnswer ?? -1,
        pairs: pairs || [],
        text: text || '',
        answers: answers || [],
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
      const questionId = parseInt(String(req.params.questionId), 10);
      if (isNaN(questionId)) {
        return res.status(400).json({ error: 'Invalid question ID' });
      }

      await triviaModel.delete(questionId);
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

  async getEvaluationsByBook(req: Request, res: Response) {
    try {
      const bookId = parseInt(String(req.params.bookId), 10);
      if (isNaN(bookId)) {
        return res.status(400).json({ error: 'Invalid book ID' });
      }

      const evaluations = await triviaModel.getEvaluationsByBook(bookId);
      return res.status(200).json(evaluations);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error getting evaluations:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createEvaluation(req: Request, res: Response) {
    try {
      const { bookId, deadline } = req.body;

      if (!bookId) {
        return res.status(400).json({ error: 'Missing required field: bookId' });
      }

      const newEvaluation = await triviaModel.createEvaluation(bookId, deadline);
      return res.status(201).json(newEvaluation);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error creating evaluation:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getEvaluationById(req: Request, res: Response) {
    try {
      const evaluationId = parseInt(String(req.params.evaluationId), 10);
      if (isNaN(evaluationId)) {
        return res.status(400).json({ error: 'Invalid evaluation ID' });
      }

      const detail = await triviaModel.getEvaluationById(evaluationId);
      if (!detail) {
        return res.status(404).json({ error: 'Evaluation not found' });
      }

      return res.status(200).json(detail);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error getting evaluation by ID:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new TriviaController();