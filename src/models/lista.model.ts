// src/models/lista.model.ts
import { db, pgp } from '../db/connect/db.js';

interface Lista {
  lista_id: number;
  nombre: string;
  descripcion: string;
  tipo: string;
}

interface CamposActualizarLista {
  nombre?: string;
  descripcion?: string;
  tipo?: string;
  [key: string]: string | undefined;
}

class ListaModel {
  async crearLista(nombre: string, descripcion: string, tipo: string): Promise<Lista> {
    try {
      const nuevaLista = await db.one<Lista>(`
        INSERT INTO lista (nombre, descripcion, tipo)
        VALUES ($1, $2, $3)
        RETURNING lista_id, nombre, descripcion, tipo;
      `, [nombre, descripcion, tipo]);

      return nuevaLista;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error en ListaModel.crearLista:', message);
      throw new Error('No se pudo crear la lista.');
    }
  }

  async obtenerTodas(): Promise<Lista[]> {
    try {
      const listas = await db.any<Lista>(`
        SELECT lista_id, nombre, descripcion, tipo
        FROM lista
        ORDER BY lista_id;
      `);

      return listas;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error en ListaModel.obtenerTodas:', message);
      throw new Error('No se pudieron obtener las listas.');
    }
  }

  async obtenerPorId(listaId: number): Promise<Lista | null> {
    try {
      const lista = await db.oneOrNone<Lista>(`
        SELECT lista_id, nombre, descripcion, tipo
        FROM lista
        WHERE lista_id = $1;
      `, [listaId]);

      return lista;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error en ListaModel.obtenerPorId (${listaId}):`, message);
      throw new Error('No se pudo obtener la lista.');
    }
  }

  async actualizarLista(
    listaId: number,
    nombre?: string,
    descripcion?: string,
    tipo?: string
  ): Promise<Lista> {
    try {
      const camposAActualizar: CamposActualizarLista = { nombre, descripcion, tipo };

      // Validación: eliminar campos undefined para evitar errores
      Object.keys(camposAActualizar).forEach((key) => {
        if (camposAActualizar[key] === undefined) {
          delete camposAActualizar[key];
        }
      });

      if (Object.keys(camposAActualizar).length === 0) {
        throw new Error('No hay campos para actualizar.');
      }

      const setClause = pgp.helpers.sets(camposAActualizar);
      const query = `
        UPDATE lista
        SET ${setClause}
        WHERE lista_id = $1
        RETURNING lista_id, nombre, descripcion, tipo;
      `;

      const updated = await db.oneOrNone<Lista>(query, [listaId]);

      if (!updated) {
        throw new Error(`Lista con ID ${listaId} no encontrada.`);
      }

      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error en ListaModel.actualizarLista:', message);
      throw error;
    }
  }

  async eliminarLista(listaId: number): Promise<boolean> {
    try {
      const result = await db.result(`
        DELETE FROM lista
        WHERE lista_id = $1
      `, [listaId]);

      if (result.rowCount === 0) {
        throw new Error(`Lista con ID ${listaId} no encontrada.`);
      }

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error en ListaModel.eliminarLista:', message);
      throw new Error('No se pudo eliminar la lista.');
    }
  }
}

export const listaModel = new ListaModel();