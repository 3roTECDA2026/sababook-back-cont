import { Request, Response } from 'express';
import authService from '../services/auth.service';
import userService from '../services/user.service';

class AuthController {
  async login(req: Request, res: Response) {
    const { email, contrasena } = req.body;

    if (!email || !contrasena) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    try {
      // El servicio maneja la verificación de contraseña y la generación del JWT
      const resultado = await authService.login(email, contrasena);

      if (!resultado) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      return res.status(200).json({
        message: 'Inicio de sesión exitoso.',
        token: resultado.token,
        userId: resultado.usuario.usuario_id,
        rol: resultado.usuario.rol_id,
        usuario: {
          usuario_id: resultado.usuario.usuario_id,
          nombre: resultado.usuario.nombre,
          email: resultado.usuario.email,
          rol_id: resultado.usuario.rol_id,
          avatar_url: resultado.usuario.avatar_url,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error durante el login:', message);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async register(req: Request, res: Response) {
    const { email, contrasena, nombre } = req.body;

    if (!email || !contrasena || !nombre) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
    }

    try {
      const existingUser = await userService.obtenerPorEmail(email);

      if (existingUser) {
        return res.status(409).json({
          error: 'El email ya está registrado. Por favor, inicia sesión o usa otro correo.',
        });
      }

      const newUser = await userService.crear(req.body);

      return res.status(201).json({
        message: 'Usuario registrado con éxito.',
        usuario: {
          usuario_id: newUser.usuario_id,
          nombre: newUser.nombre,
          email: newUser.email,
          rol_id: newUser.rol_id,
        },
      });
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  }
}

export default new AuthController();