// src/controllers/trivia.controller.ts
import { Request, Response } from 'express';
import { triviaModel, CreateTriviaData, PlayAnswerEntry } from '../models/trivia.model';
import { AuthRequest } from '../middleware/auth.middleware';

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

  async create(req: AuthRequest, res: Response) {
    try {
      const {
        bookId,
        evaluationId,
        cursoId,
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

      const numericCursoId = cursoId != null ? parseInt(String(cursoId), 10) : null;
      if (numericCursoId !== null && isNaN(numericCursoId)) {
        return res.status(400).json({ error: 'cursoId must be a valid number' });
      }

      const isAdmin = Number(req.userRole) === 3;
      if (!isAdmin) {
        if (!req.userId) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        if (!numericCursoId) {
          return res.status(400).json({ error: 'cursoId is required to assign the question to a course' });
        }
        const esDocente = await triviaModel.isDocenteDeCurso(req.userId, numericCursoId);
        if (!esDocente) {
          return res.status(403).json({ error: 'Solo un docente del curso puede crear preguntas asignadas a él.' });
        }
      }

      const data: CreateTriviaData = {
        bookId,
        evaluationId,
        cursoId: numericCursoId,
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

      const newQuestion = await triviaModel.create(data, req.userId as number);
      return res.status(201).json(newQuestion);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error creating trivia question:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const questionId = parseInt(String(req.params.questionId), 10);
      if (isNaN(questionId)) {
        return res.status(400).json({ error: 'Invalid question ID' });
      }
      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const question = await triviaModel.getById(questionId);
      if (!question) {
        return res.status(404).json({ error: `Trivia question ${questionId} not found.` });
      }

      const isAdmin = Number(req.userRole) === 3;
      const isOwner = question.docenteId === req.userId;
      const esDocente =
        question.cursoId != null ? await triviaModel.isDocenteDeCurso(req.userId, question.cursoId) : false;

      if (!isAdmin && !isOwner && !esDocente) {
        return res.status(403).json({
          error: 'No puedes eliminar esta pregunta: solo el docente que la creó o el docente del curso.',
        });
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

  async getByCourse(req: AuthRequest, res: Response) {
    try {
      const cursoId = parseInt(String(req.params.cursoId), 10);
      if (isNaN(cursoId)) {
        return res.status(400).json({ error: 'Invalid course ID' });
      }
      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const isAdmin = Number(req.userRole) === 3;
      const esDocente = await triviaModel.isDocenteDeCurso(req.userId, cursoId);
      const esAlumno = await triviaModel.isInscripto(cursoId, req.userId);

      if (!isAdmin && !esDocente && !esAlumno) {
        return res.status(403).json({
          error: 'Solo docentes del curso o alumnos inscriptos pueden ver las preguntas del curso.',
        });
      }

      const questions = await triviaModel.getByCourse(cursoId);
      return res.status(200).json(questions);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error getting trivia by course:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getEvaluationsByCourse(req: AuthRequest, res: Response) {
    try {
      const cursoId = parseInt(String(req.params.cursoId), 10);
      if (isNaN(cursoId)) {
        return res.status(400).json({ error: 'Invalid course ID' });
      }
      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const isAdmin = Number(req.userRole) === 3;
      const esDocente = await triviaModel.isDocenteDeCurso(req.userId, cursoId);
      const esAlumno = await triviaModel.isInscripto(cursoId, req.userId);

      if (!isAdmin && !esDocente && !esAlumno) {
        return res.status(403).json({
          error: 'Solo docentes del curso o alumnos inscriptos pueden ver las evaluaciones del curso.',
        });
      }

      const evaluations = await triviaModel.getEvaluationsByCourse(cursoId);
      return res.status(200).json(evaluations);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error getting evaluations by course:', message);
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

  async createEvaluation(req: AuthRequest, res: Response) {
    try {
      const { bookId, deadline, cursoId } = req.body;

      if (!bookId) {
        return res.status(400).json({ error: 'Missing required field: bookId' });
      }

      const numericCursoId = cursoId != null ? parseInt(String(cursoId), 10) : null;
      if (numericCursoId !== null && isNaN(numericCursoId)) {
        return res.status(400).json({ error: 'cursoId must be a valid number' });
      }

      const isAdmin = Number(req.userRole) === 3;
      if (!isAdmin) {
        if (!req.userId) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        if (!numericCursoId) {
          return res.status(400).json({ error: 'cursoId is required to assign the evaluation to a course' });
        }
        const esDocente = await triviaModel.isDocenteDeCurso(req.userId, numericCursoId);
        if (!esDocente) {
          return res.status(403).json({ error: 'Solo un docente del curso puede crear evaluaciones asignadas a él.' });
        }
      }

      const newEvaluation = await triviaModel.createEvaluation(bookId, deadline, numericCursoId, req.userId as number);
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

  async getTriviaForPlay(req: Request, res: Response) {
    try {
      const bookId = parseInt(String(req.params.bookId), 10);
      if (isNaN(bookId)) {
        return res.status(400).json({ error: 'Invalid book ID' });
      }

      const questions = await triviaModel.getTriviaForPlay(bookId);
      return res.status(200).json(questions);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error getting trivia for play:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getEvaluationForPlay(req: Request, res: Response) {
    try {
      const evaluationId = parseInt(String(req.params.evaluationId), 10);
      if (isNaN(evaluationId)) {
        return res.status(400).json({ error: 'Invalid evaluation ID' });
      }

      const questions = await triviaModel.getEvaluationForPlay(evaluationId);
      return res.status(200).json(questions);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error getting evaluation for play:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async checkAnswers(req: AuthRequest, res: Response) {
    try {
      const { answers, evaluationId } = req.body;
      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ error: 'answers array is required' });
      }

      const result = await triviaModel.checkAnswers(answers as PlayAnswerEntry[]);

      const evaluationNumber = evaluationId ? parseInt(String(evaluationId), 10) : null;

      if (evaluationNumber && req.userId) {
        const existing = await triviaModel.getAttempt(evaluationNumber, req.userId);
        if (existing) {
          return res.status(409).json({
            error: 'Esta evaluación ya fue respondida por este alumno.',
            attempt: existing,
          });
        }
        const questions = await triviaModel.getEvaluationForPlay(evaluationNumber);
        await triviaModel.saveAttempt({
          evaluationId: evaluationNumber,
          userId: req.userId,
          questions,
          answers: answers as PlayAnswerEntry[],
          result,
        });
      }

      return res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('already been answered')) {
        return res.status(409).json({ error: 'Esta evaluación ya fue respondida por este alumno.' });
      }
      console.error('Error checking trivia answers:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAttemptStatus(req: AuthRequest, res: Response) {
    try {
      const evaluationId = parseInt(String(req.params.evaluationId), 10);
      if (isNaN(evaluationId)) {
        return res.status(400).json({ error: 'Invalid evaluation ID' });
      }
      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const attempt = await triviaModel.getAttempt(evaluationId, req.userId);
      return res.status(200).json({
        answered: !!attempt,
        attempt: attempt
          ? {
              attemptId: attempt.attemptId,
              correctCount: attempt.correctCount,
              total: attempt.total,
              percentage: attempt.percentage,
              submittedAt: attempt.submittedAt,
            }
          : null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error getting attempted status:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAttemptsByEvaluation(req: Request, res: Response) {
    try {
      const evaluationId = parseInt(String(req.params.evaluationId), 10);
      if (isNaN(evaluationId)) {
        return res.status(400).json({ error: 'Invalid evaluation ID' });
      }

      const attempts = await triviaModel.getAttemptsByEvaluation(evaluationId);
      return res.status(200).json(attempts);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error getting attempts by evaluation:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new TriviaController();