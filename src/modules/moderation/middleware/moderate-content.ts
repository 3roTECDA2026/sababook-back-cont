import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../middleware/auth.middleware';
import { ModerationContext } from '../types/moderation.types';
import { moderateText } from '../services/moderate-text.service';
import { saveIncident } from '../repositories/save-incident.repository';

export const moderateContent = (fields: string[], context: ModerationContext) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const textsToInspect = fields
        .map(field => req.body?.[field])
        .filter((val): val is string => typeof val === 'string' && val.trim().length > 0);

      if (textsToInspect.length === 0) {
        return next();
      }

      const combinedText = textsToInspect.join('\n');
      const result = await moderateText(combinedText);

      if (!result.isAppropriate) {
        await saveIncident({
          usuario_id: req.userId,
          contexto: context,
          contenido_bloqueado: combinedText,
          motivo: result.reason || 'Incumplimiento de normas de convivencia escolar',
          categoria: result.category,
        }).catch(err => console.error('Error al registrar incidencia:', err));

        return res.status(400).json({
          ok: false,
          error: 'CONTENIDO_BLOQUEADO',
          mensaje: 'Tu mensaje no cumple con las pautas de convivencia escolar. Por favor, reformulalo respetuosamente.',
          motivo: result.reason,
        });
      }

      return next();
    } catch (error) {
      console.error('Error en middleware de moderación:', error);
      return next();
    }
  };
};
