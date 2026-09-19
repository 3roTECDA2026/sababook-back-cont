// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { authService } from '../services/auth.service';

class AuthController {
  async login(req: Request, res: Response) {
    const { email, contrasena } = req.body;
    if (!email || !contrasena) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      const result = await authService.login(email, contrasena);
      return res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === 'INVALID_CREDENTIALS') {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      console.error('Error during login:', message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const result = await authService.register(req.body);
      return res.status(201).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === 'EMAIL_EXISTS') {
        return res.status(409).json({ error: 'El email ya está registrado. Por favor, inicia sesión o usa otro correo.' });
      }
      console.error('Error al registrar usuario:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  }
}

export default new AuthController();