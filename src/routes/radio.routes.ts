// src/routes/radio.routes.ts
import { Router } from 'express';
import {
  crearEpisodio,
  obtenerTodosEpisodios,
  obtenerEpisodioPorId,
  eliminarEpisodio,
  sincronizarProgramas,
} from '../controllers/radio.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
import { TipoRol } from '@prisma/client';

const router = Router();

// Consulta pública de episodios
router.get('/', obtenerTodosEpisodios);

// Sincronización accesible a cualquier usuario autenticado
router.post('/sincronizar', verifyToken, sincronizarProgramas);

// Consulta por ID
router.get('/:id', obtenerEpisodioPorId);

// Rutas protegidas para gestión (Docente o Administrador)
router.post('/', verifyToken, requireRole(TipoRol.DOCENTE, TipoRol.ADMINISTRADOR), crearEpisodio);
router.delete('/:id', verifyToken, requireRole(TipoRol.DOCENTE, TipoRol.ADMINISTRADOR), eliminarEpisodio);

export default router;