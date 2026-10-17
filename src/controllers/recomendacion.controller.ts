import { Request, Response } from "express";
import { Prisma, PrismaClient, TipoRol } from "@prisma/client";

const prisma = new PrismaClient();

type AuthRequest = Request & {
  userId?: number;
  userRole?: TipoRol;
};

const rolesPermitidos: TipoRol[] = [TipoRol.ADMINISTRADOR, TipoRol.DOCENTE];

const validarLibroId = (valor: string): number | null => {
  const id = Number(valor);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }

  return id;
};

// GET /api/v1/recomendaciones
export const obtenerRecomendaciones = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const recomendaciones = await prisma.recomendacion_libro.findMany({
      include: {
        libro: true,
        usuario: true,
      },
      orderBy: {
        fecha_creacion: "desc",
      },
    });

    res.status(200).json(recomendaciones);
  } catch (error) {
    console.error("Error obteniendo recomendaciones:", error);

    res.status(500).json({
      error: "No se pudieron obtener las recomendaciones.",
    });
  }
};

// POST /api/v1/recomendaciones/:libroId
export const crearRecomendacion = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const libroId = validarLibroId(String(req.params.libroId));
    const usuarioId = Number(req.userId);

    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
      res.status(401).json({
        error: "Usuario no autenticado.",
      });
      return;
    }

    if (libroId === null) {
      res.status(400).json({
        error: "ID de libro inválido.",
      });
      return;
    }

    const usuario = await prisma.usuario.findUnique({
      where: { usuario_id: usuarioId },
      select: { rol: true },
    });

    if (!usuario || !rolesPermitidos.includes(usuario.rol)) {
      res.status(403).json({
        error: "No tenés permisos para recomendar libros.",
      });
      return;
    }

    const libro = await prisma.libro.findUnique({
      where: { libro_id: libroId },
    });

    if (!libro) {
      res.status(404).json({
        error: "Libro no encontrado.",
      });
      return;
    }

    const explicacion =
      typeof req.body?.explicacion === "string"
        ? req.body.explicacion.trim()
        : "";

    const recomendacion = await prisma.recomendacion_libro.create({
      data: {
        libro_id: libroId,
        usuario_id: usuarioId,
        explicacion: explicacion || null,
      },
      include: {
        libro: true,
      },
    });

    res.status(201).json({
      message: "Libro recomendado correctamente.",
      recomendacion,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(409).json({
        error: "Ya recomendaste este libro.",
      });
      return;
    }

    console.error("Error creando recomendación:", error);

    res.status(500).json({
      error: "No se pudo recomendar el libro.",
    });
  }
};

// DELETE /api/v1/recomendaciones/:libroId
export const eliminarRecomendacion = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const libroId = validarLibroId(String(req.params.libroId));
    const usuarioId = Number(req.userId);

    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
      res.status(401).json({
        error: "Usuario no autenticado.",
      });
      return;
    }

    if (libroId === null) {
      res.status(400).json({
        error: "ID de libro inválido.",
      });
      return;
    }

    const usuario = await prisma.usuario.findUnique({
      where: { usuario_id: usuarioId },
      select: { rol: true },
    });

    if (!usuario || !rolesPermitidos.includes(usuario.rol)) {
      res.status(403).json({
        error: "No tenés permisos para eliminar recomendaciones.",
      });
      return;
    }

    const resultado = await prisma.recomendacion_libro.deleteMany({
      where: {
        libro_id: libroId,
        ...(usuario.rol === TipoRol.DOCENTE ? { usuario_id: usuarioId } : {}),
      },
    });

    if (resultado.count === 0) {
      res.status(404).json({
        error: "No se encontraron recomendaciones para eliminar.",
      });
      return;
    }

    res.status(200).json({
      message: "Recomendación eliminada correctamente.",
      eliminadas: resultado.count,
    });
  } catch (error) {
    console.error("Error eliminando recomendación:", error);

    res.status(500).json({
      error: "No se pudo eliminar la recomendación.",
    });
  }
};
