// src/routes/opinion.routes.ts
import { Router } from 'express';
import OpinionController from '../controllers/opinion.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', OpinionController.getAllOpinions);
router.get('/:id', OpinionController.getOpinionById);
router.post('/', verifyToken, OpinionController.createOpinion);
router.put('/:id', verifyToken, OpinionController.updateOpinion);
router.delete('/:id', verifyToken, OpinionController.deleteOpinion);
router.get('/libro/:libro_id', OpinionController.getOpinionsByLibro);

export default router;