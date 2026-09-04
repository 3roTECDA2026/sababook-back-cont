// src/models/auth.model.ts
import { prisma } from '../db/connect/db.js';

interface UserAuth {
  usuario_id: number;
  nombre: string;
  email: string;
  contrasena: string;
  rol_id: number;
}

class AuthModel {
  async getUserByEmail(email: string): Promise<UserAuth | null> {
    try {
      const user = await prisma.usuario.findUnique({
        where: { email },
        select: {
          usuario_id: true,
          nombre: true,
          email: true,
          contrasena: true,
          rol_id: true,
        },
      });

      if (!user || user.rol_id === null) {
        return null;
      }

      return user as UserAuth;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error in AuthModel.getUserByEmail:', message);
      throw new Error('Failed to retrieve user by email');
    }
  }
}

export default new AuthModel();