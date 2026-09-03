import { z } from 'zod';

// Definimos la estructura EXACTA que permitimos recibir
export const createUserSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 letras"),
  email: z.string().email("Debe ser un email válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(['user', 'admin']).optional()
});