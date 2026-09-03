// src/controllers/lista.controller.ts
import { Request, Response } from 'express';
import { listaModel } from '../models/lista.model.js';

class ListaController {
  async crear(req: Request, res: Response) {
    try {
      const { nombre, descripcion, tipo } = req.body;

      if (!nombre || !tipo) {
        return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, tipo).' });
      }

      await listaModel.crearLista(nombre, descripcion, tipo);
      return res.status(201).json({ message: 'Lista creada correctamente.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error creando lista:', message);
      return res.status(500).json({ error: 'Error interno al crear la lista.' });
    }
  }

  async obtenerTodas(req: Request, res: Response) {
    try {
      const listas = await listaModel.obtenerTodas();
      return res.status(200).json(listas);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error obteniendo listas:', message);
      return res.status(500).json({ error: 'Error interno al obtener listas.' });
    }
  }

  async obtenerPorId(req: Request, res: Response) {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      const lista = await listaModel.obtenerPorId(id);
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
      const id = parseInt(String(req.params.id));
      const { nombre, descripcion, tipo } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      await listaModel.actualizarLista(id, nombre, descripcion, tipo);
      return res.status(200).json({ message: 'Lista actualizada.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error actualizando lista:', message);
      return res.status(500).json({ error: 'Error interno al actualizar.' });
    }
  }

  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      await listaModel.eliminarLista(id);
      return res.status(200).json({ message: 'Lista eliminada.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error eliminando lista:', message);
      return res.status(500).json({ error: 'Error interno al eliminar.' });
    }
  }
}

export default new ListaController();