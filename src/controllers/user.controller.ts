// src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { TipoRol, Prisma } from '@prisma/client';
import { userService } from '../services/user.service';
import { parsePagination } from '../utils/pagination';
import { getStringParam, QueryParamError } from '../utils/queryParams';
import { MAX_SEARCH_LENGTH } from '../utils/search';

class UserController {
  async getAllUsers(req: Request, res: Response) {
  try {
    // SAB-122: búsqueda por nombre o email
    const q = getStringParam(req.query, 'q');
    if (q && q.length > MAX_SEARCH_LENGTH) {
      return res
        .status(400)
        .json({ error: `La búsqueda no puede superar los ${MAX_SEARCH_LENGTH} caracteres.` });
    }

    // SAB-119: filtro por rol (en el servidor, para que la paginación cuente bien)
    const rol = getStringParam(req.query, 'rol')?.toUpperCase();
    if (rol && !Object.values(TipoRol).includes(rol as TipoRol)) {
      return res.status(400).json({ error: 'El rol no es válido.' });
    }

    const filters = { q, rol: rol as TipoRol | undefined };

    const pagination = parsePagination(req.query, 5);
    if (pagination) {
      const result = await userService.getUsersPaginated(pagination, filters);
      return res.status(200).json(result);
    }

    const users = await userService.getAllUsers(filters);
    res.status(200).json(users);
  } catch (error) {
    if (error instanceof QueryParamError) {
      return res.status(400).json({ error: error.message });
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error getting users:', message);
    res.status(500).json({ error: 'Database connection not established' });
  }
}

  async createUser(req: Request, res: Response) {
    try {
      const newUser = req.body;
      const rolRaw = newUser.rol ? String(newUser.rol).toUpperCase() : 'ALUMNO';
      if (!newUser.nombre || !newUser.email || !newUser.contrasena) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const result = await userService.createUser({
        ...newUser,
        rol: rolRaw as TipoRol,
      });
      res.status(201).json(result);
       } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({ error: 'Ya existe un usuario con ese email.' });
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error creating user:', message);
      res.status(500).json({ error: 'Database connection not established' });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const userId = parseInt(String(req.params.id), 10);
      const updatedUser = req.body;
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }
      const result = await userService.updateUser(userId, updatedUser);
      return res.status(200).json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('not found')) {
        return res.status(404).json({ error: errorMessage });
      }
      if (errorMessage.includes('No data provided')) {
        return res.status(400).json({ error: errorMessage });
      }
      console.error('Error updating user:', errorMessage);
      return res.status(500).json({ error: 'Internal server error: Failed to process update.' });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const userId = parseInt(String(req.params.id), 10);
      if (!userId) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      await userService.deleteUser(userId);
      return res.status(204).end();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error deleting user:', message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const userId = parseInt(String(req.params.id), 10);
      if (!userId) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      const user = await userService.getUserById(userId);
      if (user) {
        return res.status(200).json(user);
      } else {
        return res.status(404).json({ error: `User not found` });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error getting user by ID:', message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new UserController();