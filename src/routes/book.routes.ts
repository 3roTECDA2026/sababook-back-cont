import { Router } from 'express';
import { TipoRol } from '@prisma/client';
import librosController from '../controllers/book.controller';
import { verifyToken, requireAdmin, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Rutas de lectura pública del catálogo
router.get('/', librosController.obtenerCatalogo);
router.get('/buscar', librosController.buscar);

// Carga y gestión de archivos PDF como material de lectura (SAB-67)
router.post(
  '/upload-pdf',
  verifyToken,
  requireRole(TipoRol.ADMINISTRADOR, TipoRol.DOCENTE),
  librosController.cargarPdf
);
router.post(
  '/:id/pdf',
  verifyToken,
  requireRole(TipoRol.ADMINISTRADOR, TipoRol.DOCENTE),
  librosController.adjuntarPdf
);

router.get('/:id', librosController.verDetalle);

// Rutas protegidas: mutaciones de libros restringidas exclusivamente a administradores
router.post('/', verifyToken, requireAdmin, librosController.crear);
router.put('/:id', verifyToken, requireAdmin, librosController.actualizar);
router.delete('/:id', verifyToken, requireAdmin, librosController.eliminar); // Borrado físico
router.patch('/inactivar/:id', verifyToken, requireAdmin, librosController.eliminacionLogica); // Borrado lógico

export default router;