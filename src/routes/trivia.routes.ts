// src/routes/trivia.routes.ts
import { Router } from 'express';
import TriviaController from '../controllers/trivia.controller';
import { verifyToken, optionalAuth, requireRole } from '../middleware/auth.middleware';
import { TipoRol } from '@prisma/client';

const router = Router();

router.get('/evaluacion/libro/:bookId', optionalAuth, TriviaController.getEvaluationsByBook);
router.get('/evaluacion/curso/:cursoId', verifyToken, TriviaController.getEvaluationsByCourse);
router.post('/evaluacion', verifyToken, TriviaController.createEvaluation);
router.patch('/evaluacion/:evaluationId/habilitar', verifyToken, TriviaController.setEvaluationHabilitada);
router.get(
  '/evaluacion/:evaluationId',
  verifyToken,
  requireRole(TipoRol.DOCENTE, TipoRol.ADMINISTRADOR),
  TriviaController.getEvaluationById,
);

router.get('/jugar/libro/:bookId', optionalAuth, TriviaController.getTriviaForPlay);
router.get('/jugar/evaluacion/:evaluationId', verifyToken, TriviaController.getEvaluationForPlay);
router.post('/jugar/check', verifyToken, TriviaController.checkAnswers);
router.get('/jugar/evaluacion/:evaluationId/status', verifyToken, TriviaController.getAttemptStatus);

router.get(
  '/evaluacion/:evaluationId/attempts',
  verifyToken,
  requireRole(TipoRol.DOCENTE, TipoRol.ADMINISTRADOR),
  TriviaController.getAttemptsByEvaluation,
);

router.get('/libro/:bookId', verifyToken, TriviaController.getByBook);
router.get('/curso/:cursoId', verifyToken, TriviaController.getByCourse);
router.post('/', verifyToken, TriviaController.create);
router.put('/:questionId', verifyToken, TriviaController.update);
router.delete('/:questionId', verifyToken, TriviaController.delete);

export default router;