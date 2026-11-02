import { Router, Request, Response, NextFunction } from 'express';
import librosController from '../controllers/book.controller';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// SAB-060: el filtro por estado de lectura muestra qué leen los usuarios,
// así que pide sesión. El resto de la búsqueda sigue siendo pública.
const requireTokenForReadingStatus = (req: Request, res: Response, next: NextFunction) => {
  if (req.query.estado_lectura === undefined) return next();
  return verifyToken(req, res, next);
};

// Rutas de lectura pública del catálogo
router.get('/', librosController.obtenerCatalogo);
router.get('/buscar', requireTokenForReadingStatus, librosController.buscar);
router.get('/:id', librosController.verDetalle);

// Rutas protegidas: mutaciones de libros restringidas exclusivamente a administradores
router.post('/', verifyToken, requireAdmin, librosController.crear);
router.put('/:id', verifyToken, requireAdmin, librosController.actualizar);
router.delete('/:id', verifyToken, requireAdmin, librosController.eliminar); // Borrado físico
router.patch('/inactivar/:id', verifyToken, requireAdmin, librosController.eliminacionLogica); // Borrado lógico

export default router;