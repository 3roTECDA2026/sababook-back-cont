// src/middleware/auth.middleware.ts
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/connect/db';
import { TipoRol } from '@prisma/client';

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: TipoRol;
}

interface TokenPayload extends JwtPayload {
  usuario_id?: number;
  id?: number;
  rol?: TipoRol;
}

// SAB-121: verificar el JWT y distinguir tokens vencidos de inválidos.
export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'No token provided',
      code: 'TOKEN_MISSING',
    });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({
      message: 'Server configuration error: JWT_SECRET not configured',
    });
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    }) as TokenPayload;

    req.userId = decoded.usuario_id ?? decoded.id;
    req.userRole = decoded.rol ?? TipoRol.ALUMNO;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'La sesión expiró. Volvé a iniciar sesión.',
        message: 'La sesión expiró. Volvé a iniciar sesión.',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      message: 'Invalid token',
      code: 'TOKEN_INVALID',
    });
  }
};

// Autenticación opcional: no bloquea solicitudes sin token válido.
export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
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
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    }) as TokenPayload;

    req.userId = decoded.usuario_id ?? decoded.id;
    req.userRole = decoded.rol ?? TipoRol.ALUMNO;
  } catch {
    req.userId = undefined;
    req.userRole = undefined;
  }

  next();
};

export const requireRole = (...allowedRoles: TipoRol[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        error: 'Acceso denegado. Permisos insuficientes.',
      });
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
    return res.status(401).json({
      error: 'Autenticación requerida.',
    });
  }

  try {
    const user = await prisma.usuario.findUnique({
      where: { usuario_id: req.userId },
      select: { rol: true },
    });

    if (user?.rol !== TipoRol.ADMINISTRADOR) {
      return res.status(403).json({
        error: 'Acceso denegado. Se requiere rol administrador.',
      });
    }

    return next();
  } catch (error) {
    console.error('Error al verificar permisos de administrador:', error);

    return res.status(500).json({
      error: 'No se pudieron verificar los permisos.',
    });
  }
};
