import prisma from '../db/prisma';
import bcrypt from 'bcrypt';

export interface CreateUserData {
  nombre: string;
  email: string;
  contrasena: string;
  rol_id?: number;
  nivel_educativo?: string;
  avatar_url?: string;
}

class UserService {
  // Obtener usuario por email
  async obtenerPorEmail(email: string) {
    return await prisma.usuario.findUnique({
      where: { email },
      include: { rol: true },
    });
  }

  // Obtener usuario por ID
  async obtenerPorId(usuario_id: number | string) {
    return await prisma.usuario.findUnique({
      where: { usuario_id: Number(usuario_id) },
      select: {
        usuario_id: true,
        nombre: true,
        email: true,
        rol_id: true,
        avatar_url: true,
        nivel_educativo: true,
        fecha_registro: true,
        perfil_completo: true,
      },
    });
  }

  // Crear/Registrar un nuevo usuario (hasheando la contraseña)
  async crear(data: CreateUserData) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.contrasena, saltRounds);

    return await prisma.usuario.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        contrasena: hashedPassword,
        rol_id: data.rol_id ?? 2, // Rol por defecto (ej. estudiante/docente según tu DB)
        nivel_educativo: data.nivel_educativo,
        avatar_url: data.avatar_url,
      },
    });
  }
}

export default new UserService();