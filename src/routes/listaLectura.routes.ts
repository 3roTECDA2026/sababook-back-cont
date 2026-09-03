// src/routes/listaLectura.routes.ts
import { Router } from 'express';
import ListaLecturaController from '../controllers/listaLectura.controller.js';

const router = Router();

router.post('/', ListaLecturaController.crear);
router.get('/', ListaLecturaController.obtenerTodas);
router.get('/docente/:docente_id', ListaLecturaController.obtenerPorDocente);
router.put('/:lista_id/:docente_id', ListaLecturaController.actualizar);
router.delete('/:lista_id/:docente_id', ListaLecturaController.eliminar);

export default router;