// src/services/user.service.ts
import { userModel } from '../models/user.model';
import { PaginationParams } from '../utils/pagination';

export interface CreateUserDTO {
  nombre: string;
  email: string;
  contrasena: string;
  rol_id: number;
  [key: string]: any;
}

export interface UpdateUserDTO {
  [key: string]: any;
}

// NUEVO: Extendemos los parámetros de paginación para incluir la búsqueda y el filtro
export interface ExtendedPaginationParams extends PaginationParams {
  search?: string;
  filter?: string;
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

  // MODIFICADO: Ahora acepta ExtendedPaginationParams y los pasa al modelo
  async getUsersPaginated(pagination: ExtendedPaginationParams) {
    return await userModel.getUsersPaginated(pagination);
  }
}

export const userService = new UserService();