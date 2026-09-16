import { Router } from 'express';
import metaLecturaController from '../controllers/metaLectura.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/', verifyToken, metaLecturaController.crear);
router.get('/', verifyToken, metaLecturaController.obtenerTodas); // GET todas (Admin/Docente)
router.get('/usuario/:usuarioId', verifyToken, metaLecturaController.obtenerMisMetas);
router.put('/:id', verifyToken, metaLecturaController.actualizar); // PUT editar por ID
router.delete('/:id', verifyToken, metaLecturaController.eliminar);

export default router;