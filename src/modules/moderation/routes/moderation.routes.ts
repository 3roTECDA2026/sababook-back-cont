import { Router, Response } from 'express';
import { verifyToken, requireRole, AuthRequest } from '../../../middleware/auth.middleware';
import { getGeminiKey } from '../config/get-gemini-key';
import { saveGeminiKey } from '../config/save-gemini-key';
import { getIncidents } from '../repositories/get-incidents.repository';

const router = Router();

const requireAdmin = (req: AuthRequest, res: Response, next: () => void) => {
  const role = Number(req.userRole);
  if (role === 1 || role === 3) return next();
  return res.status(403).json({ error: 'Acceso denegado. Permisos insuficientes.' });
};

router.get('/config', verifyToken, requireAdmin, async (_req: AuthRequest, res: Response) => {
  const key = await getGeminiKey();
  const masked = key ? `${key.slice(0, 6)}...${key.slice(-4)}` : null;
  res.json({ configured: Boolean(key), maskedKey: masked });
});

router.post('/config', verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(400).json({ error: 'La API key de Gemini es requerida' });
  }

  await saveGeminiKey(apiKey);
  res.json({ ok: true, mensaje: 'API key de Gemini configurada exitosamente' });
});

router.get('/incidencias', verifyToken, requireAdmin, async (_req: AuthRequest, res: Response) => {
  const incidencias = await getIncidents(50);
  res.json(incidencias);
});

export default router;
