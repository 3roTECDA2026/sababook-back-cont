// src/models/lista.model.ts
import { prisma } from '../db/connect/db.js';

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
      const nuevaLista = await prisma.lista.create({
        data: {
          nombre,
          descripcion,
          tipo,
        },
        select: {
          lista_id: true,
          nombre: true,
          descripcion: true,
          tipo: true,
        },
      });

      return {
        ...nuevaLista,
        descripcion: nuevaLista.descripcion ?? '',
        tipo: nuevaLista.tipo ?? '',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error en ListaModel.crearLista:', message);
      throw new Error('No se pudo crear la lista.');
    }
  }

  async obtenerTodas(): Promise<Lista[]> {
    try {
      const listas = await prisma.lista.findMany({
        orderBy: {
          lista_id: 'asc',
        },
        select: {
          lista_id: true,
          nombre: true,
          descripcion: true,
          tipo: true,
        },
      });

      return listas.map((l) => ({
        ...l,
        descripcion: l.descripcion ?? '',
        tipo: l.tipo ?? '',
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error en ListaModel.obtenerTodas:', message);
      throw new Error('No se pudieron obtener las listas.');
    }
  }

  async obtenerPorId(listaId: number): Promise<Lista | null> {
    try {
      const lista = await prisma.lista.findUnique({
        where: { lista_id: listaId },
        select: {
          lista_id: true,
          nombre: true,
          descripcion: true,
          tipo: true,
        },
      });

      if (!lista) return null;

      return {
        ...lista,
        descripcion: lista.descripcion ?? '',
        tipo: lista.tipo ?? '',
      };
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

      // Limpieza de campos undefined
      Object.keys(camposAActualizar).forEach((key) => {
        if (camposAActualizar[key] === undefined) {
          delete camposAActualizar[key];
        }
      });

      if (Object.keys(camposAActualizar).length === 0) {
        throw new Error('No hay campos para actualizar.');
      }

      const updated = await prisma.lista.update({
        where: { lista_id: listaId },
        data: camposAActualizar,
        select: {
          lista_id: true,
          nombre: true,
          descripcion: true,
          tipo: true,
        },
      });

      return {
        ...updated,
        descripcion: updated.descripcion ?? '',
        tipo: updated.tipo ?? '',
      };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error(`Lista con ID ${listaId} no encontrada.`);
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error en ListaModel.actualizarLista:', message);
      throw error;
    }
  }

  async eliminarLista(listaId: number): Promise<boolean> {
    try {
      await prisma.lista.delete({
        where: { lista_id: listaId },
      });

      return true;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error(`Lista con ID ${listaId} no encontrada.`);
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error en ListaModel.eliminarLista:', message);
      throw new Error('No se pudo eliminar la lista.');
    }
  }
}

export const listaModel = new ListaModel();