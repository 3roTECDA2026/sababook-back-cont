// src/models/lista.model.ts
import { prisma } from "../db/connect/db";

interface Lista {
  lista_id: number;
  nombre: string;
  descripcion: string;
  tipo: string;
  libros?: any[];
}

interface CamposActualizarLista {
  nombre?: string;
  descripcion?: string;
  tipo?: string;
  [key: string]: string | undefined;
}

class ListaModel {
  async crearLista(
    nombre: string,
    descripcion: string,
    tipo: string,
  ): Promise<Lista> {
    try {
      // 1. Buscamos el ID máximo actual en la tabla para evitar la colisión de secuencia
      const ultimaLista = await prisma.lista.findFirst({
        orderBy: {
          lista_id: "desc",
        },
        select: {
          lista_id: true,
        },
      });

      const siguienteId = (ultimaLista?.lista_id ?? 0) + 1;

      // 2. Insertamos la nueva lista asegurando un ID único disponible
      const nuevaLista = await prisma.lista.create({
        data: {
          lista_id: siguienteId,
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
        descripcion: nuevaLista.descripcion ?? "",
        tipo: nuevaLista.tipo ?? "",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error en ListaModel.crearLista:", message);
      throw new Error("No se pudo crear la lista.");
    }
  }

  async obtenerTodas(): Promise<Lista[]> {
    try {
      // Ordenamiento descendente para traer siempre la recomendación más reciente primero
      // e inclusión de la relación 'lista_libro -> libro' para enviar las portadas y títulos
      const listas = await prisma.lista.findMany({
        orderBy: {
          lista_id: "desc",
        },
        include: {
          lista_libro: {
            include: {
              libro: true,
            },
          },
        },
      });

      return listas.map((l: any) => ({
        ...l,
        descripcion: l.descripcion ?? "",
        tipo: l.tipo ?? "",
        libros: l.lista_libro ? l.lista_libro.map((ll: any) => ll.libro) : [],
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error en ListaModel.obtenerTodas:", message);
      throw new Error("No se pudieron obtener las listas.");
    }
  }

  async obtenerPorId(listaId: number): Promise<Lista | null> {
    try {
      const lista = await prisma.lista.findUnique({
        where: { lista_id: listaId },
        include: {
          lista_libro: {
            include: {
              libro: true,
            },
          },
        },
      });

      if (!lista) return null;

      return {
        ...lista,
        descripcion: lista.descripcion ?? "",
        tipo: lista.tipo ?? "",
        libros: (lista as any).lista_libro
          ? (lista as any).lista_libro.map((ll: any) => ll.libro)
          : [],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error en ListaModel.obtenerPorId (${listaId}):`, message);
      throw new Error("No se pudo obtener la lista.");
    }
  }

  async actualizarLista(
    listaId: number,
    nombre?: string,
    descripcion?: string,
    tipo?: string,
  ): Promise<Lista> {
    try {
      const camposAActualizar: CamposActualizarLista = {
        nombre,
        descripcion,
        tipo,
      };

      // Limpieza de campos undefined
      Object.keys(camposAActualizar).forEach((key) => {
        if (camposAActualizar[key] === undefined) {
          delete camposAActualizar[key];
        }
      });

      if (Object.keys(camposAActualizar).length === 0) {
        throw new Error("No hay campos para actualizar.");
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
        descripcion: updated.descripcion ?? "",
        tipo: updated.tipo ?? "",
      };
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new Error(`Lista con ID ${listaId} no encontrada.`);
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error en ListaModel.actualizarLista:", message);
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
      if (error.code === "P2025") {
        throw new Error(`Lista con ID ${listaId} no encontrada.`);
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error en ListaModel.eliminarLista:", message);
      throw new Error("No se pudo eliminar la lista.");
    }
  }
}

export const listaModel = new ListaModel();