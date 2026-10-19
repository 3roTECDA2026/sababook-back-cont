
import { Response } from 'express';
import { TipoRol } from '@prisma/client';
import { prisma } from '../db/connect/db';
import { AuthRequest } from '../middleware/auth.middleware';

// Roles autorizados para crear y eliminar recomendaciones
const TIPOS_PERMITIDOS: TipoRol[] = [
  TipoRol.DOCENTE,
  TipoRol.ADMINISTRADOR,
];

// Validar el ID del libro recibido desde Express 5
function obtenerLibroId(
  valor: string | string[] | undefined
): number | null {
  if (
    typeof valor !== 'string' ||
    !/^[1-9]\d*$/.test(valor)
  ) {
    return null;
  }

  const id = Number(valor);

  return Number.isSafeInteger(id) ? id : null;
}

// Consultar el usuario y su rol actual en la base de datos
async function obtenerUsuarioAutorizado(usuarioId?: number) {
  if (
    !usuarioId ||
    !Number.isSafeInteger(usuarioId) ||
    usuarioId <= 0
  ) {
    return null;
  }

  return prisma.usuario.findUnique({
    where: {
      usuario_id: usuarioId,
    },
    select: {
      usuario_id: true,
      rol: true,
    },
  });
}

class RecomendacionController {
  // =====================================================
  // GET /api/v1/recomendaciones
  // OBTENER TODAS LAS RECOMENDACIONES
  // =====================================================

  async obtenerTodas(_req: AuthRequest, res: Response) {
    try {
      const listas = await prisma.lista.findMany({
        where: {
          tipo: 'RECOMENDACION',
        },
        select: {
          lista_id: true,
          creador_id: true,
          fecha_creacion: true,
          lista_libro: {
            select: {
              libro_id: true,
              explicacion: true,
              libro: true,
            },
          },
        },
        orderBy: {
          fecha_creacion: 'desc',
        },
      });

      // Convertir listas de recomendaciones en un arreglo
      // de libros recomendado compatible con el frontend
      const recomendaciones = listas.flatMap((lista) =>
        lista.lista_libro.map((item) => ({
          recomendacion_id: lista.lista_id,
          libro_id: item.libro_id,
          usuario_id: lista.creador_id,
          explicacion: item.explicacion ?? '',
          fecha_creacion: lista.fecha_creacion,
          libro: item.libro,
        }))
      );

      return res.status(200).json(recomendaciones);
    } catch (error) {
      console.error(
        'Error obteniendo recomendaciones:',
        error
      );

      return res.status(500).json({
        error: 'No se pudieron obtener las recomendaciones.',
      });
    }
  }

  // =====================================================
  // POST /api/v1/recomendaciones/:libroId
  // CREAR UNA RECOMENDACIÓN
  // =====================================================

  async crear(req: AuthRequest, res: Response) {
    try {
      // 1. Validar el ID del libro
      const libroId = obtenerLibroId(req.params.libroId);

      if (libroId === null) {
        return res.status(400).json({
          error: 'El ID del libro es inválido.',
        });
      }

      // 2. Verificar el usuario contra la base de datos
      const usuario = await obtenerUsuarioAutorizado(req.userId);

      if (!usuario) {
        return res.status(401).json({
          error: 'Usuario no autenticado o inexistente.',
        });
      }

      // 3. Comprobar permisos
      if (!TIPOS_PERMITIDOS.includes(usuario.rol)) {
        return res.status(403).json({
          error: 'No tenés permisos para recomendar libros.',
        });
      }

      // 4. Validar la explicación
      const { explicacion } = req.body ?? {};

      if (
        explicacion !== undefined &&
        explicacion !== null &&
        typeof explicacion !== 'string'
      ) {
        return res.status(400).json({
          error: 'La explicación debe ser un texto.',
        });
      }

      const explicacionFinal =
        typeof explicacion === 'string'
          ? explicacion.trim()
          : '';

      if (explicacionFinal.length > 5000) {
        return res.status(400).json({
          error: 'La explicación no puede superar los 5000 caracteres.',
        });
      }

      // 5. Verificar que el libro exista
      const libro = await prisma.libro.findUnique({
        where: {
          libro_id: libroId,
        },
      });

      if (!libro) {
        return res.status(404).json({
          error: 'El libro no existe.',
        });
      }

      // 6. Evitar que el mismo usuario recomiende
      // dos veces el mismo libro
      const existente = await prisma.lista.findFirst({
        where: {
          tipo: 'RECOMENDACION',
          creador_id: usuario.usuario_id,
          lista_libro: {
            some: {
              libro_id: libroId,
            },
          },
        },
        select: {
          lista_id: true,
        },
      });

      if (existente) {
        return res.status(409).json({
          error: 'Ya recomendaste este libro.',
        });
      }

      // 7. Crear la recomendación usando las tablas
      // existentes lista y lista_libro
      const nuevaLista = await prisma.lista.create({
        data: {
          nombre: `Recomendación: ${libro.titulo}`,
          descripcion: explicacionFinal,
          tipo: 'RECOMENDACION',
          creador_id: usuario.usuario_id,
          lista_libro: {
            create: {
              libro_id: libroId,
              explicacion: explicacionFinal,
            },
          },
        },
        select: {
          lista_id: true,
          creador_id: true,
          fecha_creacion: true,
        },
      });

      // 8. Responder al frontend
      return res.status(201).json({
        message: 'Libro recomendado correctamente.',
        recomendacion: {
          recomendacion_id: nuevaLista.lista_id,
          libro_id: libroId,
          usuario_id: nuevaLista.creador_id,
          explicacion: explicacionFinal,
          fecha_creacion: nuevaLista.fecha_creacion,
          libro,
        },
      });
    } catch (error) {
      console.error(
        'Error creando recomendación:',
        error
      );

      return res.status(500).json({
        error: 'No se pudo crear la recomendación.',
      });
    }
  }

  // =====================================================
  // DELETE /api/v1/recomendaciones/:libroId
  // ELIMINAR RECOMENDACIONES
  // =====================================================

  async eliminar(req: AuthRequest, res: Response) {
    try {
      // 1. Validar el ID
      const libroId = obtenerLibroId(req.params.libroId);

      if (libroId === null) {
        return res.status(400).json({
          error: 'El ID del libro es inválido.',
        });
      }

      // 2. Consultar usuario y rol actual
      const usuario = await obtenerUsuarioAutorizado(req.userId);

      if (!usuario) {
        return res.status(401).json({
          error: 'Usuario no autenticado o inexistente.',
        });
      }

      // 3. Verificar permisos
      if (!TIPOS_PERMITIDOS.includes(usuario.rol)) {
        return res.status(403).json({
          error: 'No tenés permisos para eliminar recomendaciones.',
        });
      }

      const esAdministrador =
        usuario.rol === TipoRol.ADMINISTRADOR;

      // 4. Buscar las recomendaciones permitidas
      // DOCENTE: solamente las propias
      // ADMINISTRADOR: todas las del libro
      const listas = await prisma.lista.findMany({
        where: {
          tipo: 'RECOMENDACION',
          ...(esAdministrador
            ? {}
            : {
                creador_id: usuario.usuario_id,
              }),
          lista_libro: {
            some: {
              libro_id: libroId,
            },
          },
        },
        select: {
          lista_id: true,
        },
      });

      if (listas.length === 0) {
        return res.status(404).json({
          error:
            'No se encontró una recomendación que puedas eliminar.',
        });
      }

      const listaIds = listas.map(
        (lista) => lista.lista_id
      );

      // 5. Eliminar las asociaciones correspondientes
      // y las listas de recomendación que queden vacías
      const eliminadas = await prisma.$transaction(
        async (tx) => {
          const resultado = await tx.lista_libro.deleteMany({
            where: {
              libro_id: libroId,
              lista_id: {
                in: listaIds,
              },
            },
          });

          // Solo eliminar listas de recomendación vacías.
          // Conservar las listas que todavía tengan libros
          // o estén asociadas a listas de lectura.
          await tx.lista.deleteMany({
            where: {
              lista_id: {
                in: listaIds,
              },
              tipo: 'RECOMENDACION',
              lista_libro: {
                none: {},
              },
              lista_lectura: {
                none: {},
              },
            },
          });

          return resultado.count;
        }
      );

      // 6. Respuesta
      return res.status(200).json({
        message: 'Recomendación eliminada correctamente.',
        eliminadas,
      });
    } catch (error) {
      console.error(
        'Error eliminando recomendación:',
        error
      );

      return res.status(500).json({
        error: 'No se pudo eliminar la recomendación.',
      });
    }
  }
}

export default new RecomendacionController();
