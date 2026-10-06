// src/routes/user.routes.ts
import { Router } from 'express';
import UserController from '../controllers/user.controller';
import { requireRole, verifyToken } from '../middleware/auth.middleware';

const router = Router();
const roldAdmin = 3;

// Obtener todos los usuarios
router.get('/', /*verifyToken, requireRole(roldAdmin),*/ UserController.getAllUsers);

router.get('/:id', verifyToken, UserController.getUserById);

router.post('/', UserController.createUser);

router.put('/:id', verifyToken, UserController.updateUser);

router.delete('/:id', verifyToken, requireRole(roldAdmin), UserController.deleteUser);

export default router;