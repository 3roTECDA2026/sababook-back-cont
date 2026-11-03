// src/controllers/readingList.controller.ts
import { Request, Response } from 'express';
import { TipoRol } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { readingListService } from '../services/readingList.service';
import { checkListPermission } from '../utils/listPermission';

type ErrorDePermiso = { status: number; error: string };

function parsePositiveInt(value: unknown): number | null {
  const number = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN;
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

// undefined (no vino) o texto no vacío
function esTextoOpcional(value: unknown): boolean {
  return value === undefined || (typeof value === 'string' && value.trim() !== '');
}

// SAB-104: resuelve qué registro de lista_lectura se edita o borra.
// Quien hace la acción sale del token. El :docente_id de la URL (opcional) solo indica
// de qué docente es el registro, y tocar el de otro docente es solo para administradores.
async function resolverRegistro(
  req: AuthRequest
): Promise<ErrorDePermiso | { listaId: number; docenteId: number }> {
  const usuarioId = req.userId;

  if (!usuarioId) {
    return { status: 401, error: 'Usuario no autenticado.' };
  }

  const listaId = parsePositiveInt(req.params.lista_id);
  const docenteId =
    req.params.docente_id === undefined ? usuarioId : parsePositiveInt(req.params.docente_id);

  if (!listaId || !docenteId) {
    return { status: 400, error: 'ID inválido.' };
  }

  if (docenteId !== usuarioId && req.userRole !== TipoRol.ADMINISTRADOR) {
    return { status: 403, error: 'No podés modificar la lista de lectura de otro docente.' };
  }

  const permiso = await checkListPermission(usuarioId, listaId);

  return permiso ?? { listaId, docenteId };
}

class ListaLecturaController {
  async crear(req: AuthRequest, res: Response) {
    try {
      // SAB-104: el docente sale del token; si el body trae docente_id, se ignora
      const docente_id = req.userId;

      if (!docente_id) {
        return res.status(401).json({ error: 'Usuario no autenticado.' });
      }

      const { descripcion, nivel } = req.body ?? {};
      const lista_id = parsePositiveInt(req.body?.lista_id);

      if (!lista_id || typeof descripcion !== 'string' || !descripcion.trim() || typeof nivel !== 'string' || !nivel.trim()) {
        return res.status(400).json({ error: 'Faltan campos obligatorios.' });
      }

      // Solo el administrador o quien ya tiene permiso sobre la lista puede sumarse como docente.
      // Si no, cualquier docente se agregaría a una lista ajena y podría editarla o borrarla.
      const permiso = await checkListPermission(docente_id, lista_id);

      if (permiso) {
        return res.status(permiso.status).json({ error: permiso.error });
      }

      const nuevaLista = await readingListService.crearListaLectura(
        lista_id,
        docente_id,
        descripcion,
        nivel
      );

      res.status(201).json(nuevaLista);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes('Ya existe lista_lectura')) {
        return res.status(409).json({ error: 'Ya tenés esta lista de lectura.' });
      }

      console.error('Error al crear lista de lectura:', message);
      res.status(500).json({ error: 'No se pudo crear la lista de lectura.' });
    }
  }

  async obtenerTodas(req: Request, res: Response) {
    try {
      const listas = await readingListService.obtenerTodas();
      res.status(200).json(listas);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error al obtener listas de lectura:', message);
      res.status(500).json({ error: 'Error al obtener las listas de lectura.' });
    }
  }

  async obtenerPorDocente(req: Request, res: Response) {
    try {
      const docente_id = parseInt(String(req.params.docente_id), 10);

      if (!req.params.docente_id || isNaN(docente_id)) {
        return res.status(400).json({ error: 'ID de docente es requerido.' });
      }

      const listas = await readingListService.obtenerPorDocente(docente_id);
      res.status(200).json(listas);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error al obtener listas por docente:', message);
      res.status(500).json({ error: 'No se pudieron obtener las listas.' });
    }
  }

  async actualizar(req: AuthRequest, res: Response) {
    try {
      const registro = await resolverRegistro(req);

      if ('error' in registro) {
        return res.status(registro.status).json({ error: registro.error });
      }

      const { listaId: lista_id, docenteId: docente_id } = registro;
      const { descripcion, nivel } = req.body ?? {};

      if (descripcion === undefined && nivel === undefined) {
        return res.status(400).json({ error: 'No se proporcionaron datos para actualizar.' });
      }

      // Igual que en crear: lo que venga tiene que ser texto no vacío
      if (!esTextoOpcional(descripcion) || !esTextoOpcional(nivel)) {
        return res.status(400).json({ error: 'La descripción y el nivel deben ser texto no vacío.' });
      }

      const actualizada = await readingListService.actualizarListaLectura(
        lista_id,
        docente_id,
        descripcion,
        nivel
      );

      res.status(200).json(actualizada);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes('No se encontró lista_lectura')) {
        return res.status(404).json({ error: message });
      }

      console.error('Error al actualizar lista de lectura:', message);
      res.status(500).json({ error: 'No se pudo actualizar la lista de lectura.' });
    }
  }

  async eliminar(req: AuthRequest, res: Response) {
    try {
      const registro = await resolverRegistro(req);

      if ('error' in registro) {
        return res.status(registro.status).json({ error: registro.error });
      }

      const { listaId: lista_id, docenteId: docente_id } = registro;

      await readingListService.eliminarListaLectura(lista_id, docente_id);

      res.status(204).send(); // Sin contenido
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes('No se encontró lista_lectura')) {
        return res.status(404).json({ error: message });
      }

      console.error('Error al eliminar lista de lectura:', message);
      res.status(500).json({ error: 'No se pudo eliminar la lista de lectura.' });
    }
  }
}

export default new ListaLecturaController();