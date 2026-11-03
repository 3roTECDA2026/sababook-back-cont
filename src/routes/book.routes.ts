import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import librosController from '../controllers/book.controller';
import { MAX_PDF_SIZE, MAX_PDF_SIZE_MB } from '../utils/pdfStorage';
import { TipoRol } from '@prisma/client';
import { verifyToken, requireAdmin, requireRole } from '../middleware/auth.middleware';

const router = Router();

// SAB-060: el filtro por estado de lectura muestra qué leen los alumnos,
// así que es solo para docentes y administradores. El resto de la búsqueda sigue siendo pública.
const requireStaffForReadingStatus = (req: Request, res: Response, next: NextFunction) => {
  if (req.query.estado_lectura === undefined) return next();
  return verifyToken(req, res, () =>
    requireRole(TipoRol.DOCENTE, TipoRol.ADMINISTRADOR)(req, res, next)
  );
};

// SAB-67: el PDF llega como multipart, en memoria. El límite de tamaño vale solo para esta ruta.
const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PDF_SIZE, files: 1 },
}).single('file');

const receivePdf = (req: Request, res: Response, next: NextFunction) => {
  pdfUpload(req, res, (error: unknown) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      const mensaje =
        error.code === 'LIMIT_FILE_SIZE'
          ? `El PDF no puede superar los ${MAX_PDF_SIZE_MB} MB.`
          : 'Se envía un solo archivo, en el campo "file".';
      return res.status(400).json({ mensaje });
    }
    return next(error);
  });
};

// Rutas de lectura pública del catálogo
router.get('/', librosController.obtenerCatalogo);
router.get('/buscar', requireStaffForReadingStatus, librosController.buscar);
router.get('/:id', librosController.verDetalle);

// Rutas protegidas: mutaciones de libros restringidas exclusivamente a administradores
router.post('/', verifyToken, requireAdmin, librosController.crear);
router.put('/:id', verifyToken, requireAdmin, librosController.actualizar);
router.delete('/:id', verifyToken, requireAdmin, librosController.eliminar); // Borrado físico
router.patch('/inactivar/:id', verifyToken, requireAdmin, librosController.eliminacionLogica); // Borrado lógico

// SAB-67: material de lectura en PDF. Leer pide sesión; subir y quitar, solo administradores.
router.get('/:id/pdf', verifyToken, librosController.getPdfUrl);
router.put('/:id/pdf', verifyToken, requireAdmin, receivePdf, librosController.uploadPdf);
router.delete('/:id/pdf', verifyToken, requireAdmin, librosController.deletePdf);

export default router;