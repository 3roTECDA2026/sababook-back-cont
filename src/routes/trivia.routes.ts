// src/routes/trivia.routes.ts
import { Router } from 'express';
import TriviaController from '../controllers/trivia.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/evaluacion/libro/:libroId', TriviaController.getEvaluacionesByLibro);
router.post('/evaluacion', verifyToken, TriviaController.createEvaluacion);
router.get('/evaluacion/:evaluacionId', TriviaController.getEvaluacionById);

router.get('/libro/:libroId', TriviaController.getByLibro);
router.post('/', verifyToken, TriviaController.create);
router.delete('/:preguntaId', verifyToken, TriviaController.delete);

export default router;