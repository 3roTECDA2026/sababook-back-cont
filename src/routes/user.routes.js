import { Router } from 'express';
import UserController from '../controllers/user.controller.js';
import { requireRole, verifyToken } from '../middleware/auth.middleware.js';
// 1. IMPORTANTE: Importás el middleware de validación y tu esquema de Zod
import { validateSchema } from '../middleware/validate.middleware.js'; 
import { createUserSchema } from '../schemas/user.schema.js'; 

const router = Router();
const roldAdmin = 3;

// Obtener todos los usuarios
router.get("/", verifyToken, requireRole(roldAdmin), UserController.getAllUsers);

router.get("/:id", verifyToken, UserController.getUserById);

// BUG-05: verifyToken + requireRole(roldAdmin)
// BUG-04: validateSchema(createUserSchema)
router.post(
  "/", 
  verifyToken, 
  requireRole(roldAdmin), 
  validateSchema(createUserSchema), 
  UserController.createUser
);

router.put("/:id", verifyToken, UserController.updateUser);

router.delete("/:id", verifyToken, requireRole(roldAdmin), UserController.deleteUser);

export default router;
