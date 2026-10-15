import { Router, Response } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../../../middleware/auth.middleware';
import { getGeminiKey } from '../config/get-gemini-key';
import { saveGeminiKey } from '../config/save-gemini-key';
import { getIncidents } from '../repositories/get-incidents.repository';
import { updateIncidentState } from '../repositories/update-incident-state.repository';

const router = Router();

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

router.patch('/incidencias/:id', verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const incidenciaId = Number(req.params.id);
  const { decision } = req.body as { decision?: string };
  if (!Number.isInteger(incidenciaId)) {
    return res.status(400).json({ error: 'ID de incidencia inválido' });
  }
  if (decision !== 'aceptada' && decision !== 'rechazada') {
    return res.status(400).json({ error: "decision debe ser 'aceptada' o 'rechazada'" });
  }
  try {
    const incidencia = await updateIncidentState(incidenciaId, decision, req.userId);
    return res.json({ ok: true, incidencia });
  } catch {
    return res.status(404).json({ error: 'Incidencia no encontrada' });
  }
});

export default router;
