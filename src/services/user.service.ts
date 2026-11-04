import {
  userModel,
  UserFilters,
  UpdateUserData,
  countEnrollmentsDB,
  getUserRoleDB,
} from '../models/user.model';
import { PaginationParams } from '../utils/pagination';
import { hashPassword, MIN_PASSWORD_LENGTH } from '../utils/password';
import { TipoRol } from '@prisma/client';

export interface CreateUserDTO {
  nombre: string;
  email: string;
  contrasena: string;
  rol?: TipoRol;
  [key: string]: any;
}

export interface UpdateUserDTO {
  [key: string]: any;
}

// Error de una regla de negocio de usuarios, con su código HTTP
export class UserRuleError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const MAX_NAME_LENGTH = 100;
const MAX_LEVEL_LENGTH = 50;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Texto opcional que se puede vaciar: undefined = no se toca; '' o null = se borra
const parseOptionalText = (value: unknown, field: string, maxLength?: number) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new UserRuleError(400, `El campo ${field} debe ser un texto.`);
  }
  const text = value.trim();
  if (maxLength && text.length > maxLength) {
    throw new UserRuleError(400, `El campo ${field} no puede superar los ${maxLength} caracteres.`);
  }
  return text === '' ? null : text;
};

// SAB-136: arma los datos a guardar solo con los campos que puede cambiar quien edita.
// Un usuario puede cambiar su nombre, avatar, nivel y contraseña; el admin, además, email y rol.
// Los demás campos del body se ignoran (el Perfil siempre manda el email, por ejemplo).
const buildUpdateData = async (body: UpdateUserDTO, isAdmin: boolean): Promise<UpdateUserData> => {
  const data: UpdateUserData = {};

  if (body.nombre !== undefined) {
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
    if (!nombre || nombre.length > MAX_NAME_LENGTH) {
      throw new UserRuleError(400, `El nombre es obligatorio y puede tener hasta ${MAX_NAME_LENGTH} caracteres.`);
    }
    data.nombre = nombre;
  }

  const avatar = parseOptionalText(body.avatar_url, 'avatar_url');
  if (avatar !== undefined) data.avatar_url = avatar;

  const nivel = parseOptionalText(body.nivel_educativo, 'nivel_educativo', MAX_LEVEL_LENGTH);
  if (nivel !== undefined) data.nivel_educativo = nivel;

  // Contraseña vacía o ausente: no se cambia
  if (body.contrasena !== undefined && body.contrasena !== null && body.contrasena !== '') {
    if (typeof body.contrasena !== 'string' || body.contrasena.length < MIN_PASSWORD_LENGTH) {
      throw new UserRuleError(
        400,
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
      );
    }
    data.contrasena = await hashPassword(body.contrasena);
  }

  if (isAdmin) {
    if (body.email !== undefined) {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      if (!EMAIL_PATTERN.test(email)) {
        throw new UserRuleError(400, 'El email no es válido.');
      }
      data.email = email;
    }

    if (body.rol !== undefined) {
      const rol = String(body.rol).toUpperCase();
      if (!Object.values(TipoRol).includes(rol as TipoRol)) {
        throw new UserRuleError(400, 'El rol no es válido.');
      }
      data.rol = rol as TipoRol;
    }
  }

  return data;
};

class UserService {
  // SAB-136: el admin accede a cualquier usuario; los demás, solo a sí mismos.
  // El rol se lee de la base (como requireAdmin), no del token.
  async assertCanAccessUser(targetId: number, requesterId: number | undefined, deniedMessage: string) {
    if (!requesterId) {
      throw new UserRuleError(401, 'Autenticación requerida.');
    }
    const requesterRole = await getUserRoleDB(requesterId);
    if (!requesterRole) {
      throw new UserRuleError(401, 'Usuario no encontrado.');
    }
    const isAdmin = requesterRole === TipoRol.ADMINISTRADOR;
    if (!isAdmin && targetId !== requesterId) {
      throw new UserRuleError(403, deniedMessage);
    }
    return { isAdmin };
  }

  async getAllUsers(filters: UserFilters = {}) {
    return await userModel.getAllUsers(filters);
  }

  // SAB-136: el admin ve a cualquiera; los demás, solo sus propios datos
  async getUserById(id: number, requesterId: number | undefined) {
    await this.assertCanAccessUser(id, requesterId, 'No podés ver los datos de otro usuario.');
    return await userModel.getUserById(id);
  }

  async createUser(userData: CreateUserDTO) {
    return await userModel.createUser(userData);
  }

  async updateUser(id: number, body: UpdateUserDTO, requesterId: number | undefined) {
    const { isAdmin } = await this.assertCanAccessUser(
      id,
      requesterId,
      'No podés modificar los datos de otro usuario.'
    );

    const data = await buildUpdateData(body ?? {}, isAdmin);
    if (Object.keys(data).length === 0) {
      throw new UserRuleError(400, 'No hay datos para actualizar.');
    }

    // SAB-136: para no quedarse sin administradores, un admin no puede quitarse su propio rol
    if (id === requesterId && data.rol && data.rol !== TipoRol.ADMINISTRADOR) {
      throw new UserRuleError(
        409,
        'No podés quitarte el rol de administrador. Pedíselo a otro administrador.'
      );
    }

    // SAB-116: un alumno inscripto en un curso (en cualquier año) no puede dejar de ser alumno
    if (data.rol && data.rol !== TipoRol.ALUMNO && (await countEnrollmentsDB(id)) > 0) {
      throw new UserRuleError(
        409,
        'El alumno está inscripto en un curso. Quitalo del curso antes de cambiarle el rol.'
      );
    }

    return await userModel.updateUser(id, data);
  }

  // La ruta ya exige admin. SAB-136: no puede eliminar su propia cuenta (no quedarse sin administradores)
  async deleteUser(id: number, requesterId: number | undefined) {
    if (id === requesterId) {
      throw new UserRuleError(409, 'No podés eliminar tu propia cuenta. Pedíselo a otro administrador.');
    }
    return await userModel.deleteUser(id);
  }

  async getUsersPaginated(pagination: PaginationParams, filters: UserFilters = {}) {
    return await userModel.getUsersPaginated(pagination, filters);
  }
}

export const userService = new UserService();