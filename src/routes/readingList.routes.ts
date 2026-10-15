// src/routes/listaLectura.routes.ts
import { Router } from "express";
import readinglistController from "../controllers/list.controller";

const router = Router();

router.post("/", readinglistController.crear);
router.get("/", readinglistController.obtenerTodas);
router.get("/docente/:docente_id", readinglistController.obtenerTodas);
router.put("/:lista_id/:docente_id", readinglistController.actualizar);
router.delete("/:lista_id/:docente_id", readinglistController.eliminar);

export default router;
