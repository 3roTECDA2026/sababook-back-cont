// src/services/auth.service.ts
import authModel from '../models/auth.model';
import { userModel } from '../models/user.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

class AuthService {
  async login(email: string, contrasena: string) {
    const user = await authModel.getUserByEmail(email);
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const passwordMatch = await bcrypt.compare(contrasena, user.contrasena);
    if (!passwordMatch) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET_NOT_CONFIGURED');
    }

    const payload = {
      usuario_id: user.usuario_id,
      nombre: user.nombre,
      rol: user.rol,
    };

    const token = jwt.sign(payload, secret, { expiresIn: '1h', algorithm: 'HS256' });

    return {
      message: 'Inicio de sesión exitoso.',
      token: token,
      userId: user.usuario_id,
      rol: user.rol,
    };
  }

  async register(userData: any) {
    const existingUser = await authModel.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('EMAIL_EXISTS');
    }

    const newUser = await userModel.createUser(userData);

    return {
      message: 'Usuario registrado con éxito.',
      usuario: {
        usuario_id: newUser.usuario_id,
        email: newUser.email,
      },
    };
  }
}

export const authService = new AuthService();