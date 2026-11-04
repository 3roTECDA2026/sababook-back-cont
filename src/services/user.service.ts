import { userModel, UserFilters, countEnrollmentsDB } from '../models/user.model';
import { PaginationParams } from '../utils/pagination';
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
class UserService {
  async getAllUsers(filters: UserFilters = {}) {
    return await userModel.getAllUsers(filters);
  }

  async getUserById(id: number) {
    return await userModel.getUserById(id);
  }

  async createUser(userData: CreateUserDTO) {
    return await userModel.createUser(userData);
  }

    async updateUser(id: number, userData: UpdateUserDTO) {
    // SAB-116: un alumno inscripto en un curso (en cualquier año) no puede dejar de ser alumno
    const newRole = userData?.rol ? String(userData.rol).toUpperCase() : undefined;
    if (newRole && newRole !== TipoRol.ALUMNO && (await countEnrollmentsDB(id)) > 0) {
      throw new UserRuleError(
        409,
        'El alumno está inscripto en un curso. Quitalo del curso antes de cambiarle el rol.'
      );
    }

    return await userModel.updateUser(id, userData);
  }

  async deleteUser(id: number) {
    return await userModel.deleteUser(id);
  }

  async getUsersPaginated(pagination: PaginationParams, filters: UserFilters = {}) {
    return await userModel.getUsersPaginated(pagination, filters);
  }
}

export const userService = new UserService();