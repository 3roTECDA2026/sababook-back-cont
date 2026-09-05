// src/models/listaLectura.model.ts
import { prisma } from '../db/connect/db';

interface ListaLectura {
  lista_id: number;
  docente_id: number;
  descripcion: string;
  nivel: string;
  fecha_creacion: Date;
}

interface ListaLecturaConNombre {
  lista_id: number;
  docente_id?: number;
  nombre_lista: string;
  descripcion: string;
  nivel: string;
  fecha_creacion: Date;
}

interface CamposActualizarListaLectura {
  descripcion?: string;
  nivel?: string;
  [key: string]: string | undefined;
}

class ListaLecturaModel {
  async crearListaLectura(
    lista_id: number,
    docente_id: number,
    descripcion: string,
    nivel: string
  ): Promise<ListaLectura> {
    try {
      const nueva = await prisma.lista_lectura.create({
        data: {
          lista_id,
          docente_id,
          descripcion,
          nivel,
        },
      });

      return {
        lista_id: nueva.lista_id,
        docente_id: nueva.docente_id,
        descripcion: nueva.descripcion ?? '',
        nivel: nueva.nivel ?? '',
        fecha_creacion: nueva.fecha_creacion ?? new Date(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error en ListaLecturaModel.crearListaLectura:', message);
      throw new Error('No se pudo crear la lista de lectura.');
    }
  }

  async obtenerTodas(): Promise<ListaLecturaConNombre[]> {
    try {
      const listas = await prisma.lista_lectura.findMany({
        include: {
          lista: {
            select: {
              nombre: true,
            },
          },
        },
        orderBy: {
          fecha_creacion: 'desc',
        },
      });

      return listas.map((item) => ({
        lista_id: item.lista_id,
        docente_id: item.docente_id,
        nombre_lista: item.lista?.nombre ?? '',
        descripcion: item.descripcion ?? '',
        nivel: item.nivel ?? '',
        fecha_creacion: item.fecha_creacion ?? new Date(),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error en ListaLecturaModel.obtenerTodas:', message);
      throw new Error('No se pudieron obtener las listas de lectura.');
    }
  }

  async obtenerPorDocente(docente_id: number): Promise<ListaLecturaConNombre[]> {
    try {
      const listas = await prisma.lista_lectura.findMany({
        where: { docente_id },
        include: {
          lista: {
            select: {
              nombre: true,
            },
          },
        },
        orderBy: {
          fecha_creacion: 'desc',
        },
      });

      return listas.map((item) => ({
        lista_id: item.lista_id,
        nombre_lista: item.lista?.nombre ?? '',
        descripcion: item.descripcion ?? '',
        nivel: item.nivel ?? '',
        fecha_creacion: item.fecha_creacion ?? new Date(),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error en ListaLecturaModel.obtenerPorDocente (${docente_id}):`, message);
      throw new Error('No se pudieron obtener las listas del docente.');
    }
  }

  async actualizarListaLectura(
    lista_id: number,
    docente_id: number,
    descripcion?: string,
    nivel?: string
  ): Promise<ListaLectura> {
    try {
      const campos: CamposActualizarListaLectura = { descripcion, nivel };

      Object.keys(campos).forEach((key) => {
        if (campos[key] === undefined) delete campos[key];
      });

      if (Object.keys(campos).length === 0) {
        throw new Error('No hay campos para actualizar.');
      }

      const updated = await prisma.lista_lectura.update({
        where: {
          lista_id_docente_id: {
            lista_id,
            docente_id,
          },
        },
        data: campos,
      });

      return {
        lista_id: updated.lista_id,
        docente_id: updated.docente_id,
        descripcion: updated.descripcion ?? '',
        nivel: updated.nivel ?? '',
        fecha_creacion: updated.fecha_creacion ?? new Date(),
      };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error(`No se encontró lista_lectura con lista_id ${lista_id} y docente_id ${docente_id}.`);
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error en ListaLecturaModel.actualizarListaLectura:', message);
      throw error;
    }
  }

  async eliminarListaLectura(lista_id: number, docente_id: number): Promise<boolean> {
    try {
      await prisma.lista_lectura.delete({
        where: {
          lista_id_docente_id: {
            lista_id,
            docente_id,
          },
        },
      });

      return true;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error(`No se encontró lista_lectura con lista_id ${lista_id} y docente_id ${docente_id}.`);
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error en ListaLecturaModel.eliminarListaLectura:', message);
      throw new Error('No se pudo eliminar la lista de lectura.');
    }
  }
}

export const listaLecturaModel = new ListaLecturaModel();