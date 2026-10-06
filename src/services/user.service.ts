// src/services/user.service.ts
import { userModel } from '../models/user.model';

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
}

export const userService = new UserService();