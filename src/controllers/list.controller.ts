
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { listService } from '../services/list.service';
import { prisma } from '../db/connect/db';

interface LibroRecomendado {
  libroId: number;
  explicacion: string;
}

class ListaController {

  // =====================================================
  // CREAR LISTA O RECOMENDACIÓN
  // =====================================================

  async crear(req: AuthRequest, res: Response) {
    try {
      const {
        nombre,
        descripcion,
        tipo,
        libroId,
        bookId,
        books,
        bookIds,
        libros,
      } = req.body;

      const usuarioId = req.userId;

      if (!usuarioId) {
        return res.status(401).json({
          error: 'Usuario no autenticado.',
        });
      }

      // 1. Validar campos obligatorios
      if (
        typeof nombre !== 'string' ||
        !nombre.trim() ||
        typeof tipo !== 'string' ||
        !tipo.trim()
      ) {
        return res.status(400).json({
          error: 'Faltan campos obligatorios (nombre, tipo).',
        });
      }

      if (
        descripcion !== undefined &&
        descripcion !== null &&
        typeof descripcion !== 'string'
      ) {
        return res.status(400).json({
          error: 'La descripción debe ser un texto.',
        });
      }

      const descripcionFinal = descripcion ?? '';

      // 2. Normalizar libros recibidos
      // Compatible con el formato nuevo y el anterior

      let librosRecibidos: LibroRecomendado[] = [];

      if (libros !== undefined) {
        if (!Array.isArray(libros)) {
          return res.status(400).json({
            error: 'El campo libros debe ser un arreglo.',
          });
        }

        librosRecibidos = libros.map((item: any) => ({
          libroId: Number(item?.libroId ?? item?.bookId),
          explicacion:
            typeof item?.explicacion === 'string'
              ? item.explicacion.trim()
              : '',
        }));

      } else if (Array.isArray(bookIds)) {

        librosRecibidos = bookIds.map((id: any, index: number) => ({
          libroId: Number(id),
          explicacion:
            index === 0 ? descripcionFinal.trim() : '',
        }));

      } else if (Array.isArray(books)) {

        librosRecibidos = books.map((item: any, index: number) => ({
          libroId: Number(
            item?.libroId ??
            item?.bookId ??
            item?.libro_id ??
            item?.id ??
            item
          ),
          explicacion:
            typeof item?.explicacion === 'string'
              ? item.explicacion.trim()
              : index === 0
                ? descripcionFinal.trim()
                : '',
        }));

      } else if (libroId != null || bookId != null) {

        librosRecibidos = [{
          libroId: Number(libroId ?? bookId),
          explicacion: descripcionFinal.trim(),
        }];
      }

      // 3. Validar cantidad de libros
      // RECOMENDACION: mínimo uno, sin límite máximo

      if (
        tipo === 'RECOMENDACION' &&
        librosRecibidos.length < 1
      ) {
        return res.status(400).json({
          error: 'Debés recomendar al menos un libro.',
        });
      }

      // Para otras listas, permitimos no enviar libros,
      // manteniendo el comportamiento anterior.

      if (
        librosRecibidos.some(
          (item) =>
            !Number.isSafeInteger(item.libroId) ||
            item.libroId <= 0
        )
      ) {
        return res.status(400).json({
          error: 'Uno de los libros tiene un ID inválido.',
        });
      }

      const ids = librosRecibidos.map(
        (item) => item.libroId
      );

      // 4. Evitar libros duplicados dentro de la misma lista
      if (new Set(ids).size !== ids.length) {
        return res.status(400).json({
          error: 'No podés recomendar el mismo libro dos veces.',
        });
      }

      // 5. Validar explicaciones en el formato nuevo
      if (
        tipo === 'RECOMENDACION' &&
        libros !== undefined &&
        librosRecibidos.some(
          (item) => !item.explicacion
        )
      ) {
        return res.status(400).json({
          error: 'Cada libro debe tener su explicación.',
        });
      }

      // 6. Validar usuario para el feed
      const usuarioIdNumerico =
        usuarioId == null ? null : Number(usuarioId);

      if (
        usuarioIdNumerico !== null &&
        (!Number.isSafeInteger(usuarioIdNumerico) ||
          usuarioIdNumerico <= 0)
      ) {
        return res.status(400).json({
          error: 'El ID del usuario es inválido.',
        });
      }

      // 7. Crear lista y asociar libros en una transacción
      const resultado = await prisma.$transaction(
        async (tx) => {

          // Verificar que todos los libros existan
          const librosExistentes = await tx.libro.findMany({
            where: {
              libro_id: {
                in: ids,
              },
            },
          });

          if (librosExistentes.length !== ids.length) {
            throw new Error('LIBROS_NO_ENCONTRADOS');
          }

          // Crear lista
          // PostgreSQL genera el ID automáticamente
          const nuevaLista = await tx.lista.create({
            data: {
              nombre: nombre.trim(),
              descripcion: descripcionFinal,
              tipo: tipo.trim(),
            },
          });

          // Vincular todos los libros con su explicación
          if (librosRecibidos.length > 0) {
            await tx.lista_libro.createMany({
              data: librosRecibidos.map((item) => ({
                lista_id: nuevaLista.lista_id,
                libro_id: item.libroId,
                explicacion: item.explicacion,
              })),
            });
          }

          const librosConExplicacion =
            librosRecibidos.map((item) => ({
              ...librosExistentes.find(
                (libro) =>
                  libro.libro_id === item.libroId
              ),
              explicacion: item.explicacion,
            }));

          return {
            nuevaLista,
            librosConExplicacion,
          };
        }
      );

      // 8. Registrar actividad en el feed
      // Se mantiene como operación no bloqueante
      try {
        await prisma.actividad_feed.create({
          data: {
            usuario_id: usuarioIdNumerico,
            tipo: 'AVISO',
            titulo:
              tipo === 'RECOMENDACION'
                ? 'Publicó una recomendación de libros'
                : `Creó una nueva lista: "${nombre.trim()}"`,
            descripcion:
              descripcionFinal ||
              `Nueva lista de tipo ${tipo}`,
            entidad_id: resultado.nuevaLista.lista_id,
          },
        });
      } catch (feedError) {
        console.error(
          'No se pudo registrar la actividad en el feed:',
          feedError
        );
      }

      // 9. Devolver respuesta
      return res.status(201).json({
        message: 'Lista creada correctamente.',
        lista: resultado.nuevaLista,

        // Compatibilidad con el frontend anterior
        libro: resultado.librosConExplicacion[0] ?? null,

        // Nuevo formato
        libros: resultado.librosConExplicacion,
      });

    } catch (error: unknown) {

      if (
        error instanceof Error &&
        error.message === 'LIBROS_NO_ENCONTRADOS'
      ) {
        return res.status(400).json({
          error: 'Uno o más libros no existen en el catálogo.',
        });
      }

      console.error('Error creando lista:', error);

      return res.status(500).json({
        error: 'Error interno al crear la lista.',
      });
    }
  }

  // =====================================================
  // OBTENER TODAS LAS LISTAS
  // =====================================================

  async obtenerTodas(req: Request, res: Response) {
    try {
      const listas = await listService.obtenerTodas();

      return res.status(200).json(listas);

    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      console.error('Error obteniendo listas:', message);

      return res.status(500).json({
        error: 'Error interno al obtener listas.',
      });
    }
  }

  // =====================================================
  // OBTENER LISTA POR ID
  // =====================================================

  async obtenerPorId(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          error: 'ID inválido.',
        });
      }

      const lista = await listService.obtenerPorId(id);

      if (!lista) {
        return res.status(404).json({
          error: 'Lista no encontrada.',
        });
      }

      return res.status(200).json(lista);

    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      console.error(
        'Error obteniendo lista por ID:',
        message
      );

      return res.status(500).json({
        error: 'Error interno.',
      });
    }
  }

  // =====================================================
  // ACTUALIZAR LISTA
  // =====================================================

  async actualizar(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          error: 'ID inválido.',
        });
      }

      const { nombre, descripcion, tipo } = req.body;

      await listService.actualizarLista(
        id,
        nombre,
        descripcion,
        tipo
      );

      return res.status(200).json({
        message: 'Lista actualizada.',
      });

    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      console.error('Error actualizando lista:', message);

      return res.status(500).json({
        error: 'Error interno al actualizar.',
      });
    }
  }

  // =====================================================
  // ELIMINAR LISTA
  // =====================================================

  async eliminar(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          error: 'ID inválido.',
        });
      }

      await listService.eliminarLista(id);

      return res.status(200).json({
        message: 'Lista eliminada.',
      });

    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      console.error('Error eliminando lista:', message);

      return res.status(500).json({
        error: 'Error interno al eliminar.',
      });
    }
  }
}

export default new ListaController();
