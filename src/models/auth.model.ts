// src/models/auth.model.ts
import { db, pgp } from '../db/connect/db.js';

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
      const user = await db.oneOrNone<UserAuth>(`
                SELECT
                    usuario_id,
                    nombre,
                    email,
                    contrasena,
                    rol_id
                    FROM
                    usuario
                WHERE
                    email = $1
            `, [email]);
      return user;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error in AuthModel.getUserByEmail:', message);
      throw new Error('Failed to retrieve user by email');
    }
  }
}

export default new AuthModel();