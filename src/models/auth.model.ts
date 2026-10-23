// src/models/auth.model.ts
import { prisma } from '../db/connect/db';

import { TipoRol } from '@prisma/client';

interface UserAuth {
  usuario_id: number;
  nombre: string;
  email: string;
  contrasena: string;
  rol: TipoRol;
  avatar_url: string | null;
  nivel_educativo: string | null;
  perfil_completo: boolean;
  fecha_registro: Date;
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
          rol: true,
          avatar_url: true,
          nivel_educativo: true,
          perfil_completo: true,
          fecha_registro: true,
        },
      });

      if (!user) {
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