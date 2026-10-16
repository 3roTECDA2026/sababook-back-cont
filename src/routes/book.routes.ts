import { Router } from 'express';
import librosController from '../controllers/book.controller';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Rutas de lectura pública del catálogo
router.get('/', librosController.obtenerCatalogo);
router.get('/buscar', librosController.buscar);
router.get('/:id', librosController.verDetalle);

// Rutas protegidas: mutaciones de libros restringidas exclusivamente a administradores
router.post('/', verifyToken, requireAdmin, librosController.crear);
router.put('/:id', verifyToken, requireAdmin, librosController.actualizar);
router.delete('/:id', verifyToken, requireAdmin, librosController.eliminar); // Borrado físico
router.patch('/inactivar/:id', verifyToken, requireAdmin, librosController.eliminacionLogica); // Borrado lógico

export default router;