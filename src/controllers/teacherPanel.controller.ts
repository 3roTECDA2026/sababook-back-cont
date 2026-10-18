import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ErrorNegocio } from '../services/course.service';
import { teacherPanelService, DIAS_ABANDONO_POR_DEFECTO } from '../services/teacherPanel.service';

export const obtenerPanelDocente = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.userId || !req.userRole) {
    res.status(401).json({ error: 'Autenticación requerida.' });
    return;
  }

  // ?curso_id=N filtra un curso; sin él, se incluyen todos los cursos del docente
  let cursoId: number | null = null;
  if (req.query.curso_id !== undefined) {
    cursoId = Number(req.query.curso_id);
    if (!Number.isInteger(cursoId) || cursoId <= 0) {
      res.status(400).json({ error: 'El ID del curso no es válido.' });
      return;
    }
  }

  // ?dias=N define cuántos días en "Leyendo" cuentan como abandono
  let dias = DIAS_ABANDONO_POR_DEFECTO;
  if (req.query.dias !== undefined) {
    dias = Number(req.query.dias);
    if (!Number.isInteger(dias) || dias < 1 || dias > 365) {
      res.status(400).json({ error: 'El parámetro dias debe ser un entero entre 1 y 365.' });
      return;
    }
  }

  try {
    const panel = await teacherPanelService.obtenerPanel(req.userId, req.userRole, cursoId, dias);
    res.status(200).json(panel);
  } catch (error) {
    if (error instanceof ErrorNegocio) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    console.error('Error al obtener el panel docente:', error);
    res.status(500).json({ error: 'Error interno al obtener el panel docente.' });
  }
};