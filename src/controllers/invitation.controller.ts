import { Request, Response } from 'express';
import { InvitationError, invitationService } from '../services/invitation.service';

class InvitationController {
  async importar(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Adjuntá la planilla Excel en el campo "file".' });
      }
      if (!/\.xlsx$/i.test(req.file.originalname)) {
        return res.status(400).json({ error: 'La planilla debe ser un archivo .xlsx.' });
      }

      const resultado = await invitationService.importarPlanilla(req.file.buffer);
      return res.status(201).json(resultado);
    } catch (error) {
      if (error instanceof InvitationError) {
        return res.status(error.status).json({ error: error.message });
      }
      const mensaje = error instanceof Error ? error.message : String(error);
      console.error('Error al importar invitaciones:', mensaje);
      return res.status(500).json({ error: 'No se pudo procesar la planilla.' });
    }
  }

  async validar(req: Request, res: Response) {
    try {
      const resultado = await invitationService.validarToken(String(req.params.token));
      return res.status(200).json(resultado);
    } catch (error) {
      if (error instanceof InvitationError) {
        return res.status(error.status).json({ error: error.message });
      }
      console.error('Error al validar invitación:', error);
      return res.status(500).json({ error: 'No se pudo validar la invitación.' });
    }
  }

  async activar(req: Request, res: Response) {
    try {
      const { contrasena } = req.body ?? {};
      const resultado = await invitationService.activarCuenta(
        String(req.params.token),
        typeof contrasena === 'string' ? contrasena : ''
      );
      return res.status(200).json(resultado);
    } catch (error) {
      if (error instanceof InvitationError) {
        return res.status(error.status).json({ error: error.message });
      }
      console.error('Error al activar cuenta:', error);
      return res.status(500).json({ error: 'No se pudo activar la cuenta.' });
    }
  }
}

export default new InvitationController();
