// src/middleware/auth.middleware.ts
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/connect/db';

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

interface TokenPayload extends JwtPayload {
  usuario_id?: number;
  id?: number;
  rol?: string;
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ message: 'Server configuration error: JWT_SECRET not configured' });
  }

  try {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as TokenPayload;

    req.userId = decoded.usuario_id ?? decoded.id;
    req.userRole = decoded.rol ?? 'ALUMNO';

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as TokenPayload;

    req.userId = decoded.usuario_id ?? decoded.id;
    req.userRole = decoded.rol ?? 'ALUMNO';
  } catch {
    req.userId = undefined;
    req.userRole = undefined;
  }

  next();
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
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
      include: { rol: { select: { nombre_rol: true } } },
    });

    const rolNombre = user?.rol?.nombre_rol;

    if (rolNombre !== 'ADMINISTRADOR' && rolNombre !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol administrador.' });
    }

    return next();
  } catch (error) {
    console.error('Error al verificar permisos de administrador:', error);
    return res.status(500).json({ error: 'No se pudieron verificar los permisos.' });
  }
};