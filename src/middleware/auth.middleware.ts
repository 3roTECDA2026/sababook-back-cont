// src/middleware/auth.middleware.ts
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/connect/db';

// Extendemos Request para que TS conozca userId y userRole
// una vez que pasó por este middleware
export interface AuthRequest extends Request {
  userId?: number;
  userRole?: number;
}

interface TokenPayload extends JwtPayload {
  usuario_id?: number;
  id?: number;
  rol_id?: number;
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Extrae solo el token

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;

    req.userId = decoded.usuario_id ?? decoded.id;
    req.userRole = decoded.rol_id ?? 1;

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

/**
 * Middleware de Autorización: Verifica si el usuario autenticado tiene el rol requerido.
 * Se usa después de verifyToken.
 * @param requiredRole - El ID del rol necesario para acceder (ej: 1, 2, 99).
 */
export const requireRole = (requiredRole: number) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRoleNumber = Number(req.userRole);
    if (!userRoleNumber || userRoleNumber !== requiredRole) {
      return res.status(403).json({ error: 'Acceso denegado. Permisos insuficientes.' });
    }
    next();
  };
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Autenticación requerida.' });
  }

  try {
    const user = await prisma.usuario.findUnique({
      where: { usuario_id: req.userId },
      select: { rol_id: true },
    });

    if (user?.rol_id !== 3) {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol administrador.' });
    }

    return next();
  } catch (error) {
    console.error('Error al verificar permisos de administrador:', error);
    return res.status(500).json({ error: 'No se pudieron verificar los permisos.' });
  }
};