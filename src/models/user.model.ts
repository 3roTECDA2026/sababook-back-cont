// src/models/user.model.ts
import { db, pgp } from '../db/connect/db.js';
import bcrypt from 'bcrypt';

export interface User {
  usuario_id: number;
  nombre: string;
  email: string;
  contrasena: string;
  rol_id: number;
  fecha_registro: Date;
  perfil_completo: boolean;
  avatar_url: string | null;
  nivel_educativo: string | null;
}

interface UserConRol {
  usuario_id: number;
  nombre: string;
  email: string;
  rol: string;
  fecha_registro: Date;
  perfil_completo: boolean;
  avatar_url: string | null;
  nivel_educativo: string | null;
}

interface CreateUserData {
  nombre: string;
  email: string;
  contrasena: string;
  rol_id: number;
  perfil_completo?: boolean;
  avatar_url?: string | null;
  nivel_educativo?: string | null;
}

interface NewUserResult {
  usuario_id: number;
  nombre: string;
  email: string;
  fecha_registro: Date;
  rol_id: number;
}

type UpdateUserData = Partial<Omit<User, 'usuario_id'>>;

class UserModel {
  async getAllUsers(): Promise<UserConRol[]> {
    const sqlQuery = `
            SELECT
                u.usuario_id,
                u.nombre,
                u.email,
                r.nombre_rol AS rol,
                u.fecha_registro,
                u.perfil_completo,
                u.avatar_url,
                u.nivel_educativo
            FROM
                usuario u
            INNER JOIN
                rol r ON u.rol_id = r.rol_id
            ORDER BY u.usuario_id;
        `;
    try {
      const users = await db.any<UserConRol>(sqlQuery);
      return users;
    } catch (error) {
      console.error('Error UserModel.getAllUsers:', error);
      throw new Error('Failed to retrieve users.');
    }
  }

  async createUser(userData: CreateUserData): Promise<NewUserResult> {
    const saltRounds = 10;
    const {
      nombre,
      email,
      contrasena,
      rol_id,
      perfil_completo = false,
      avatar_url = null,
      nivel_educativo = null,
    } = userData;

    const fecha_registro = new Date();

    try {
      const hashedPassword = await bcrypt.hash(contrasena, saltRounds);
      const newUser = await db.one<NewUserResult>(`
                INSERT INTO 
                    usuario (nombre, email, contrasena, rol_id, fecha_registro, perfil_completo, avatar_url, nivel_educativo) 
                VALUES 
                    ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING 
                    usuario_id, nombre, email, fecha_registro, rol_id;
            `, [
        nombre,
        email,
        hashedPassword,
        rol_id,
        fecha_registro,
        perfil_completo,
        avatar_url,
        nivel_educativo,
      ]);

      return newUser;
    } catch (error) {
      console.error('Error en UserModel.createUser:', error);
      throw error;
    }
  }

  async updateUser(userId: number, userData: UpdateUserData): Promise<User> {
    try {
      if (Object.keys(userData).length === 0) {
        throw new Error('No data provided for update.');
      }
      const setClause = pgp.helpers.sets(userData);
      const sqlQuery = `
            UPDATE 
                usuario
            SET 
                ${setClause}
            WHERE 
                usuario_id = $1
            RETURNING 
                usuario_id, nombre, email, rol_id, perfil_completo, fecha_registro, avatar_url, nivel_educativo;
        `;
      const updatedUser = await db.oneOrNone<User>(sqlQuery, [userId]);

      if (!updatedUser) {
        throw new Error(`User ID ${userId} not found.`);
      }
      return updatedUser;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error in UserModel.updateUser:', message);
      throw error;
    }
  }

  async getUserById(userId: number): Promise<UserConRol | null> {
    const sqlQuery = `
            SELECT
                u.usuario_id,
                u.nombre,
                u.email,
                u.fecha_registro,
                u.perfil_completo,
                u.avatar_url,
                u.nivel_educativo,
                r.nombre_rol AS rol
            FROM
                usuario u
            INNER JOIN
                rol r ON u.rol_id = r.rol_id
            WHERE
                u.usuario_id = $1; 
        `;
    try {
      const user = await db.oneOrNone<UserConRol>(sqlQuery, [userId]);
      return user;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(message);
      throw new Error('Failed to retrieve user from the database');
    }
  }

  async deleteUser(userId: number): Promise<boolean> {
    try {
      const result = await db.result(`
                DELETE FROM 
                    usuario
                WHERE 
                    usuario_id = $1
            `, [userId]);

      if (result.rowCount === 0) {
        throw new Error(`User ID ${userId} not found.`);
      }

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error UserModel.deleteUser (ID: ${userId}):`, message);
      throw new Error('Failed to delete user from the database.');
    }
  }
}

export const userModel = new UserModel();