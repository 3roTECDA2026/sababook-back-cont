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

const router = Router();

// Consulta pública de episodios
router.get('/', obtenerTodosEpisodios);

// Sincronización accesible a cualquier usuario autenticado
router.post('/sincronizar', verifyToken, sincronizarProgramas);

// Consulta por ID
router.get('/:id', obtenerEpisodioPorId);

// Rutas protegidas para gestión (Rol 1 = Docente / Admin)
router.post('/', verifyToken, requireRole(1), crearEpisodio);
router.delete('/:id', verifyToken, requireRole(1), eliminarEpisodio);

export default router;