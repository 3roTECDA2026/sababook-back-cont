// src/routes/review.routes.ts
import { Router } from 'express';
import reviewController from '../controllers/review.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', reviewController.getAllOpinions.bind(reviewController));
router.get('/:id', reviewController.getOpinionById.bind(reviewController));
router.post('/', verifyToken, reviewController.createOpinion.bind(reviewController));
router.put('/:id', verifyToken, reviewController.updateOpinion.bind(reviewController));
router.delete('/:id', verifyToken, reviewController.deleteOpinion.bind(reviewController));

// Rutas para opiniones por libro (soporta tanto /book/:bookId como /libro/:bookId)
router.get('/book/:bookId', reviewController.getOpinionsByLibro.bind(reviewController));
router.get('/libro/:bookId', reviewController.getOpinionsByLibro.bind(reviewController)); // <-- AGREGADO

export default router;