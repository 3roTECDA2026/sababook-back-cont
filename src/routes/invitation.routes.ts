import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import invitationController from '../controllers/invitation.controller';
import { requireAdmin, verifyToken } from '../middleware/auth.middleware';

const router = Router();

const MAX_PLANILLA_BYTES = 5 * 1024 * 1024;

const subirPlanilla = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PLANILLA_BYTES, files: 1 },
}).single('file');

const receivePlanilla = (req: Request, res: Response, next: NextFunction) => {
  subirPlanilla(req, res, (error: unknown) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      const mensaje =
        error.code === 'LIMIT_FILE_SIZE'
          ? 'La planilla no puede superar los 5 MB.'
          : 'Se envía un solo archivo, en el campo "file".';
      return res.status(400).json({ error: mensaje });
    }
    return next(error);
  });
};

router.post('/import', verifyToken, requireAdmin, receivePlanilla, invitationController.importar);
router.get('/:token', invitationController.validar);
router.post('/:token/activate', invitationController.activar);

export default router;
