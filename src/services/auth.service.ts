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

    const payload = {
      usuario_id: user.usuario_id,
      nombre: user.nombre,
      rol_id: user.rol_id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' });

    return {
      message: 'Inicio de sesión exitoso.',
      token: token,
      userId: user.usuario_id,
      rol: user.rol_id,
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