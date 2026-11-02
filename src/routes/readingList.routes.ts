// src/routes/readingList.routes.ts
import { Router } from "express";
import { TipoRol } from "@prisma/client";
import readingListController from "../controllers/readingList.controller";
import { verifyToken, requireRole } from "../middleware/auth.middleware";

const router = Router();

// SAB-104: crear, editar y borrar piden sesión de docente o administrador.
// Quién hace la acción sale siempre del token.
const canManage = [verifyToken, requireRole(TipoRol.DOCENTE, TipoRol.ADMINISTRADOR)];

router.get("/", readingListController.obtenerTodas);
router.get("/docente/:docente_id", readingListController.obtenerPorDocente);
router.post("/", ...canManage, readingListController.crear);
router.put("/:lista_id", ...canManage, readingListController.actualizar);
router.delete("/:lista_id", ...canManage, readingListController.eliminar);
// Compatibilidad: :docente_id indica qué registro tocar, no quién hace la acción
router.put("/:lista_id/:docente_id", ...canManage, readingListController.actualizar);
router.delete("/:lista_id/:docente_id", ...canManage, readingListController.eliminar);

export default router;
