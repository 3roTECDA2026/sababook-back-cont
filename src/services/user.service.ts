import { userModel } from '../models/user.model';
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

class UserService {
  async getAllUsers() {
    return await userModel.getAllUsers();
  }

  async getUserById(id: number) {
    return await userModel.getUserById(id);
  }

  async createUser(userData: CreateUserDTO) {
    return await userModel.createUser(userData);
  }

  async updateUser(id: number, userData: UpdateUserDTO) {
    return await userModel.updateUser(id, userData);
  }

  async deleteUser(id: number) {
    return await userModel.deleteUser(id);
  }

  async getUsersPaginated(pagination: PaginationParams) {
  return await userModel.getUsersPaginated(pagination);
}
}

export const userService = new UserService();