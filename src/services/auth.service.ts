import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import prisma from '../db/prisma';

export interface RegisterData {
  nombre: string;
  email: string;
  contrasena: string;
  rol_id?: number;
  avatar_url?: string;
  nivel_educativo?: string;
}

class AuthService {
  async buscarPorEmail(email: string) {
    return await prisma.usuario.findUnique({
      where: { email },
    });
  }

  async registrar(data: RegisterData) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.contrasena, saltRounds);

    return await prisma.usuario.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        contrasena: hashedPassword,
        rol_id: data.rol_id ?? 1,
        avatar_url: data.avatar_url,
        nivel_educativo: data.nivel_educativo,
      },
      select: {
        usuario_id: true,
        nombre: true,
        email: true,
        rol_id: true,
        avatar_url: true,
        fecha_registro: true,
      },
    });
  }

  async login(email: string, pass: string) {
    const user = await this.buscarPorEmail(email);
    if (!user || !user.contrasena) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const isHashed = user.contrasena.startsWith('$2a$') || user.contrasena.startsWith('$2b$');
    let isValidPassword = false;

    if (isHashed) {
      isValidPassword = await bcrypt.compare(pass, user.contrasena);
    } else {
      isValidPassword = pass === user.contrasena;
    }

    if (!isValidPassword) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const userId = Number(user.usuario_id);
    const secretKey = process.env.JWT_SECRET || 'secret_key';

    const token = jwt.sign(
      { id: userId, usuario_id: userId, email: user.email, rol_id: user.rol_id },
      secretKey,
      { expiresIn: '24h' }
    );

    const { contrasena, ...userWithoutPassword } = user;
    const userPayload = { ...userWithoutPassword, id: userId, usuario_id: userId };

    return {
      token,
      user: userPayload,
      usuario: userPayload,
    };
  }
}

export default new AuthService();