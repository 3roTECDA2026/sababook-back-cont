// src/models/user.model.ts
import { prisma } from '../db/connect/db';
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
    try {
      const users = await prisma.usuario.findMany({
        include: {
          rol: {
            select: {
              nombre_rol: true,
            },
          },
        },
        orderBy: {
          usuario_id: 'asc',
        },
      });

      return users.map((u) => ({
        usuario_id: u.usuario_id,
        nombre: u.nombre,
        email: u.email,
        rol: u.rol?.nombre_rol ?? '',
        fecha_registro: u.fecha_registro ?? new Date(),
        perfil_completo: u.perfil_completo ?? false,
        avatar_url: u.avatar_url,
        nivel_educativo: u.nivel_educativo,
      }));
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

      const newUser = await prisma.usuario.create({
        data: {
          nombre,
          email,
          contrasena: hashedPassword,
          rol_id,
          fecha_registro,
          perfil_completo,
          avatar_url,
          nivel_educativo,
        },
        select: {
          usuario_id: true,
          nombre: true,
          email: true,
          fecha_registro: true,
          rol_id: true,
        },
      });

      return {
        ...newUser,
        fecha_registro: newUser.fecha_registro ?? fecha_registro,
      };
    } catch (error) {
      console.error('Error en UserModel.createUser:', error);
      throw error;
    }
  }

  async updateUser(userId: number, userData: UpdateUserData): Promise<User> {
    // Filtrar valores undefined
    const dataToUpdate: Record<string, any> = {};
    Object.keys(userData).forEach((key) => {
      const val = (userData as any)[key];
      if (val !== undefined) {
        dataToUpdate[key] = val;
      }
    });

    if (Object.keys(dataToUpdate).length === 0) {
      throw new Error('No data provided for update.');
    }

    try {
      const updatedUser = await prisma.usuario.update({
        where: { usuario_id: userId },
        data: dataToUpdate,
      });

      return {
        usuario_id: updatedUser.usuario_id,
        nombre: updatedUser.nombre,
        email: updatedUser.email,
        contrasena: updatedUser.contrasena,
        rol_id: updatedUser.rol_id,
        fecha_registro: updatedUser.fecha_registro ?? new Date(),
        perfil_completo: updatedUser.perfil_completo ?? false,
        avatar_url: updatedUser.avatar_url,
        nivel_educativo: updatedUser.nivel_educativo,
      };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error(`User ID ${userId} not found.`);
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error in UserModel.updateUser:', message);
      throw error;
    }
  }

  async getUserById(userId: number): Promise<UserConRol | null> {
    try {
      const user = await prisma.usuario.findUnique({
        where: { usuario_id: userId },
        include: {
          rol: {
            select: {
              nombre_rol: true,
            },
          },
        },
      });

      if (!user) return null;

      return {
        usuario_id: user.usuario_id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol?.nombre_rol ?? '',
        fecha_registro: user.fecha_registro ?? new Date(),
        perfil_completo: user.perfil_completo ?? false,
        avatar_url: user.avatar_url,
        nivel_educativo: user.nivel_educativo,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(message);
      throw new Error('Failed to retrieve user from the database');
    }
  }

  async deleteUser(userId: number): Promise<boolean> {
    try {
      await prisma.usuario.delete({
        where: { usuario_id: userId },
      });

      return true;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error(`User ID ${userId} not found.`);
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error UserModel.deleteUser (ID: ${userId}):`, message);
      throw new Error('Failed to delete user from the database.');
    }
  }
}

export const userModel = new UserModel();