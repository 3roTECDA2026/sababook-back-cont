// src/routes/medal.routes.ts
import { Router } from 'express';
import { obtenerMedallasUsuario } from '../controllers/medal.controller';

const router = Router();

// Ruta para obtener las medallas de un usuario
router.get('/:usuario_id', obtenerMedallasUsuario);

export default router;