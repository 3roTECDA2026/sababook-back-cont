// src/controllers/listaLectura.controller.ts
import { Request, Response } from 'express';
import { readingListService } from '../services/readingList.service';

class ListaLecturaController {
  async crear(req: Request, res: Response) {
    try {
      const { lista_id, docente_id, descripcion, nivel } = req.body;

      if (!lista_id || !docente_id || !descripcion || !nivel) {
        return res.status(400).json({ error: 'Faltan campos obligatorios.' });
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

  async actualizar(req: Request, res: Response) {
    try {
      const lista_id = parseInt(String(req.params.lista_id), 10);
      const docente_id = parseInt(String(req.params.docente_id), 10);
      const { descripcion, nivel } = req.body;

      if (!descripcion && !nivel) {
        return res.status(400).json({ error: 'No se proporcionaron datos para actualizar.' });
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

  async eliminar(req: Request, res: Response) {
    try {
      const lista_id = parseInt(String(req.params.lista_id), 10);
      const docente_id = parseInt(String(req.params.docente_id), 10);

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