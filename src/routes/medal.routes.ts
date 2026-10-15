// src/routes/medal.routes.ts
import { Router } from 'express';
import { obtenerMedallasUsuario } from '../controllers/medal.controller';
import { obtenerCatalogoInsignias } from '../controllers/medal.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// Ruta para obtener el catálogo completo de insignias (obtenidas + disponibles) de un usuario
router.get('/catalog/:usuario_id', verifyToken, obtenerCatalogoInsignias);

// Ruta para obtener las medallas de un usuario
router.get('/:usuario_id', verifyToken, obtenerMedallasUsuario);

export default router;