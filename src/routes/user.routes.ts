// src/routes/user.routes.ts
import { Router } from 'express';
import UserController from '../controllers/user.controller';
import { requireAdmin, verifyToken } from '../middleware/auth.middleware';

const router = Router();
// Obtener todos los usuarios
router.get('/', verifyToken, requireAdmin, UserController.getAllUsers);

router.get('/:id', verifyToken, UserController.getUserById);

router.post('/', UserController.createUser);

router.put('/:id', verifyToken, UserController.updateUser);

router.delete('/:id', verifyToken, requireAdmin, UserController.deleteUser);

export default router;