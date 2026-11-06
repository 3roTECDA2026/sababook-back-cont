// src/models/lista.model.ts

import { prisma } from "../db/connect/db";

// ======================================================
// INTERFACES
// ======================================================

interface LibroLista {
  libro_id: number;
  titulo: string;
  autor: string;
  explicacion: string;
  [key: string]: unknown;
}

interface Lista {
  lista_id: number;
  nombre: string;
  descripcion: string;
  tipo: string;
  libros?: LibroLista[];
}

interface CamposActualizarLista {
  nombre?: string;
  descripcion?: string;
  tipo?: string;
  [key: string]: string | undefined;
}

// ======================================================
// MODELO DE LISTAS
// ======================================================

class ListaModel {

  // ====================================================
  // CREAR LISTA
  // ====================================================

  async crearLista(
    nombre: string,
    descripcion: string,
    tipo: string
  ): Promise<Lista> {
    try {

      // Buscar el ID más alto existente
      const ultimaLista = await prisma.lista.findFirst({
        orderBy: {
          lista_id: "desc",
        },
        select: {
          lista_id: true,
        },
      });

      const siguienteId = (ultimaLista?.lista_id ?? 0) + 1;

      // Crear la lista
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
        libros: [],
      };

    } catch (error) {

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        "Error en ListaModel.crearLista:",
        message
      );

      throw new Error("No se pudo crear la lista.");
    }
  }

  // ====================================================
  // OBTENER TODAS LAS LISTAS
  // ====================================================

  async obtenerTodas(tipo?: string): Promise<Lista[]> {
    try {
      const whereClause = tipo ? { tipo: { equals: tipo, mode: 'insensitive' as const } } : {};

      // Obtener listas ordenadas de la más reciente
      // a la más antigua
      const listas = await prisma.lista.findMany({
        where: whereClause,
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

      // Convertir los resultados al formato
      // utilizado por el frontend
      return listas.map((lista) => ({

        lista_id: lista.lista_id,
        nombre: lista.nombre,
        descripcion: lista.descripcion ?? "",
        tipo: lista.tipo ?? "",

        // Obtener todos los libros de cada lista
        // con su explicación independiente
        libros: lista.lista_libro.map((relacion) => ({

          ...relacion.libro,

          explicacion: relacion.explicacion ?? "",

        })),

      }));

    } catch (error) {

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        "Error en ListaModel.obtenerTodas:",
        message
      );

      throw new Error("No se pudieron obtener las listas.");
    }
  }

  // ====================================================
  // OBTENER LISTA POR ID
  // ====================================================

  async obtenerPorId(
    listaId: number
  ): Promise<Lista | null> {
    try {

      // Buscar la lista por su ID
      const lista = await prisma.lista.findUnique({
        where: {
          lista_id: listaId,
        },
        include: {
          lista_libro: {
            include: {
              libro: true,
            },
          },
        },
      });

      // Si no existe la lista
      if (!lista) {
        return null;
      }

      // Devolver lista con todos sus libros
      // y explicaciones individuales
      return {

        lista_id: lista.lista_id,
        nombre: lista.nombre,
        descripcion: lista.descripcion ?? "",
        tipo: lista.tipo ?? "",

        libros: lista.lista_libro.map((relacion) => ({

          ...relacion.libro,

          explicacion: relacion.explicacion ?? "",

        })),

      };

    } catch (error) {

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        `Error en ListaModel.obtenerPorId (${listaId}):`,
        message
      );

      throw new Error("No se pudo obtener la lista.");
    }
  }

  // ====================================================
  // ACTUALIZAR LISTA
  // ====================================================

  async actualizarLista(
    listaId: number,
    nombre?: string,
    descripcion?: string,
    tipo?: string
  ): Promise<Lista> {
    try {

      // Campos que se pueden actualizar
      const camposAActualizar: CamposActualizarLista = {
        nombre,
        descripcion,
        tipo,
      };

      // Eliminar propiedades undefined
      Object.keys(camposAActualizar).forEach((key) => {

        if (camposAActualizar[key] === undefined) {
          delete camposAActualizar[key];
        }

      });

      // Verificar que haya campos para actualizar
      if (Object.keys(camposAActualizar).length === 0) {
        throw new Error("No hay campos para actualizar.");
      }

      // Actualizar lista
      const updated = await prisma.lista.update({
        where: {
          lista_id: listaId,
        },
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
        throw new Error(
          `Lista con ID ${listaId} no encontrada.`
        );
      }

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        "Error en ListaModel.actualizarLista:",
        message
      );

      throw error;
    }
  }

  // ====================================================
  // ELIMINAR LISTA
  // ====================================================

  async eliminarLista(
    listaId: number
  ): Promise<boolean> {
    try {

      // Eliminar lista
      await prisma.lista.delete({
        where: {
          lista_id: listaId,
        },
      });

      return true;

    } catch (error: any) {

      if (error.code === "P2025") {
        throw new Error(
          `Lista con ID ${listaId} no encontrada.`
        );
      }

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        "Error en ListaModel.eliminarLista:",
        message
      );

      throw new Error("No se pudo eliminar la lista.");
    }
  }
}

// ======================================================
// EXPORTAR MODELO
// ======================================================

export const listaModel = new ListaModel();