import { Request, Response } from 'express';
import { listService } from '../services/list.service';
import { prisma } from '../db/connect/db';

class ListaController {
  async crear(req: Request, res: Response) {
    try {
      const { nombre, descripcion, tipo, libroId, bookId, books, bookIds } = req.body;
      const usuarioId = (req as any).user?.id || (req as any).usuarioId;

      if (!nombre || !tipo) {
        return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, tipo).' });
      }

      // 1. Obtener y parsear el ID del libro
      const rawBookId =
        libroId ||
        bookId ||
        (Array.isArray(books) ? books[0] : null) ||
        (Array.isArray(bookIds) ? bookIds[0] : null);
      const targetBookId = rawBookId ? Number(rawBookId) : null;

      // 2. Crear la lista principal
      const nuevaLista = await listService.crearLista(nombre, descripcion, tipo);

      let libroAsociado = null;

      // 3. Vincular libro solo si existe en la base de datos
      if (targetBookId && !isNaN(targetBookId)) {
        try {
          // Buscamos si el libro existe en la tabla libro o book
          const libroExistente =
            (await (prisma as any).libro?.findUnique({
              where: { libro_id: targetBookId },
            })) ||
            (await (prisma as any).book?.findUnique({
              where: { id: targetBookId },
            }));

          if (libroExistente) {
            await (prisma as any).lista_libro.create({
              data: {
                lista_id: nuevaLista.lista_id,
                libro_id: targetBookId,
              },
            });
            // Guardamos los datos del libro para devolverlos en la respuesta
            libroAsociado = libroExistente;
          } else {
            console.warn(`[WARN] El libro con ID ${targetBookId} no existe en la base de datos.`);
          }
        } catch (relError) {
          console.error('No se pudo vincular el libro a la lista:', relError);
        }
      }

      // 4. Registrar en el Muro de Actividades
      try {
        await prisma.actividad_feed.create({
          data: {
            usuario_id: usuarioId ? Number(usuarioId) : null,
            tipo: 'AVISO',
            titulo: `Creó una nueva lista: "${nombre}"`,
            descripcion: descripcion || `Nueva lista de tipo ${tipo}`,
          },
        });
      } catch (feedError) {
        console.error('No se pudo registrar la actividad en el feed:', feedError);
      }

      // Retornamos la respuesta con la lista y el libro asociado
      return res.status(201).json({
        message: 'Lista creada correctamente.',
        lista: nuevaLista,
        libro: libroAsociado,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error creando lista:', message);
      return res.status(500).json({ error: 'Error interno al crear la lista.' });
    }
  }

  async obtenerTodas(req: Request, res: Response) {
    try {
      const listas = await listService.obtenerTodas();
      return res.status(200).json(listas);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error obteniendo listas:', message);
      return res.status(500).json({ error: 'Error interno al obtener listas.' });
    }
  }

  async obtenerPorId(req: Request, res: Response) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      const lista = await listService.obtenerPorId(id);
      if (!lista) {
        return res.status(404).json({ error: 'Lista no encontrada.' });
      }

      return res.status(200).json(lista);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error obteniendo lista por ID:', message);
      return res.status(500).json({ error: 'Error interno.' });
    }
  }

  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const { nombre, descripcion, tipo } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      await listService.actualizarLista(id, nombre, descripcion, tipo);
      return res.status(200).json({ message: 'Lista actualizada.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error actualizando lista:', message);
      return res.status(500).json({ error: 'Error interno al actualizar.' });
    }
  }

  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      await listService.eliminarLista(id);
      return res.status(200).json({ message: 'Lista eliminada.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error eliminando lista:', message);
      return res.status(500).json({ error: 'Error interno al eliminar.' });
    }
  }
}

export default new ListaController();