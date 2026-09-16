// src/routes/trivia.routes.ts
import { Router } from 'express';
import TriviaController from '../controllers/trivia.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/evaluacion/libro/:bookId', TriviaController.getEvaluationsByBook);
router.post('/evaluacion', verifyToken, TriviaController.createEvaluation);
router.get('/evaluacion/:evaluationId', TriviaController.getEvaluationById);

router.get('/libro/:bookId', TriviaController.getByBook);
router.post('/', verifyToken, TriviaController.create);
router.delete('/:questionId', verifyToken, TriviaController.delete);

export default router;