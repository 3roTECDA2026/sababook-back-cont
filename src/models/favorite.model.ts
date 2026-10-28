
import { prisma } from '../db/connect/db';

interface Favorite {
  usuario_id: number;
  libro_id: number;
}

export type ReadingStatus =
  | 'general'
  | 'quiero-leer'
  | 'leyendo'
  | 'leido';

export interface ReadingStatusRecord {
  libro_id: number;
  estado_lectura: ReadingStatus;
  fecha_estado: Date;
}

export interface ReadingProgressRecord {
  libro_id: number;
  pagina_actual: number;
  paginas_totales: number;
  porcentaje: number;
}

export interface ReadBooksCountRecord {
  libros_leidos: number;
}

interface FavoriteBook {
  libro_id: number;
  titulo: string;
  autor: string;
  genero: string;
  descripcion: string;
  portada_url: string;
  calificacion_promedio: number;
  estado_lectura: ReadingStatus;
  fecha_estado: Date;
  current_page: number;
}

export class ReadingProgressError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'ReadingProgressError';
  }
}

const ESTADO_GENERAL: ReadingStatus = 'general';

export const favoriteModel = {
  // ==========================================
  // SAB-87: AGREGAR FAVORITO
  // ==========================================

  async createFavorite({
    usuario_id,
    libro_id,
  }: Favorite): Promise<Favorite> {
    const favorito = await prisma.favorito.upsert({
      where: {
        usuario_id_libro_id: {
          usuario_id,
          libro_id,
        },
      },
      update: {
        es_favorito: true,
      },
      create: {
        usuario_id,
        libro_id,
        es_favorito: true,
      },
    });

    return {
      usuario_id: favorito.usuario_id,
      libro_id: favorito.libro_id,
    };
  },

  // ==========================================
  // SAB-87: CONSULTAR FAVORITOS
  // ==========================================

  async getAllFavorites(): Promise<Favorite[]> {
    const favoritos = await prisma.favorito.findMany({
      where: {
        es_favorito: true,
      },
    });

    return favoritos.map((f) => ({
      usuario_id: f.usuario_id,
      libro_id: f.libro_id,
    }));
  },

  async getFavoritesByUser(
    usuario_id: number
  ): Promise<FavoriteBook[]> {
    const favoritos = await prisma.favorito.findMany({
      where: {
        usuario_id,
        es_favorito: true,
      },
      include: {
        libro: true,
      },
    });

    return favoritos.map((f) => ({
      libro_id: f.libro.libro_id,
      titulo: f.libro.titulo,
      autor: f.libro.autor,
      genero: f.libro.genero ?? '',
      descripcion: f.libro.descripcion ?? '',
      portada_url: f.libro.portada_url ?? '',
      calificacion_promedio: Number(
        f.libro.calificacion_promedio ?? 0
      ),
      estado_lectura: f.estado_lectura as ReadingStatus,
      fecha_estado: f.fecha_estado,
      current_page: f.current_page,
    }));
  },

  // ==========================================
  // SAB-87: CONSULTAR ESTADOS DE LECTURA
  // ==========================================

  async getReadingStatusesByUser(
    usuario_id: number
  ): Promise<ReadingStatusRecord[]> {
    const registros = await prisma.favorito.findMany({
      where: {
        usuario_id,
      },
      select: {
        libro_id: true,
        estado_lectura: true,
        fecha_estado: true,
      },
    });

    return registros.map((registro) => ({
      libro_id: registro.libro_id,
      estado_lectura:
        registro.estado_lectura as ReadingStatus,
      fecha_estado: registro.fecha_estado,
    }));
  },

  // ==========================================
  // SAB-87 + SAB-91: ACTUALIZAR ESTADO
  // ==========================================

  async updateReadingStatus(
    usuario_id: number,
    libro_id: number,
    estado_lectura: ReadingStatus
  ): Promise<ReadingStatusRecord> {
    const where = {
      usuario_id_libro_id: {
        usuario_id,
        libro_id,
      },
    };

    const actual = await prisma.favorito.findUnique({
      where,
      select: {
        estado_lectura: true,
        fecha_estado: true,
        es_favorito: true,
        current_page: true,
      },
    });

    // Si no existe, general no crea un registro.
    if (!actual) {
      if (estado_lectura === ESTADO_GENERAL) {
        return {
          libro_id,
          estado_lectura: ESTADO_GENERAL,
          fecha_estado: new Date(),
        };
      }

      // El estado de lectura no marca favorito.
      const creado = await prisma.favorito.create({
        data: {
          usuario_id,
          libro_id,
          estado_lectura,
          es_favorito: false,
        },
        select: {
          libro_id: true,
          estado_lectura: true,
          fecha_estado: true,
        },
      });

      return {
        libro_id: creado.libro_id,
        estado_lectura:
          creado.estado_lectura as ReadingStatus,
        fecha_estado: creado.fecha_estado,
      };
    }

    // Solo se elimina si:
    // - vuelve a general
    // - no es favorito
    // - no tiene progreso guardado
    if (
      estado_lectura === ESTADO_GENERAL &&
      !actual.es_favorito &&
      actual.current_page === 0
    ) {
      await prisma.favorito.delete({
        where,
      });

      return {
        libro_id,
        estado_lectura: ESTADO_GENERAL,
        fecha_estado: actual.fecha_estado,
      };
    }

    // Si el estado no cambia, conservar fecha.
    if (actual.estado_lectura === estado_lectura) {
      return {
        libro_id,
        estado_lectura,
        fecha_estado: actual.fecha_estado,
      };
    }

    // Cambiar estado sin tocar favorito ni progreso.
    const actualizado = await prisma.favorito.update({
      where,
      data: {
        estado_lectura,
        fecha_estado: new Date(),
      },
      select: {
        libro_id: true,
        estado_lectura: true,
        fecha_estado: true,
      },
    });

    return {
      libro_id: actualizado.libro_id,
      estado_lectura:
        actualizado.estado_lectura as ReadingStatus,
      fecha_estado: actualizado.fecha_estado,
    };
  },

  // ==========================================
  // SAB-91: CONTADOR DE LIBROS LEÍDOS
  // ==========================================

  async countReadBooks(
    usuario_id: number
  ): Promise<ReadBooksCountRecord> {
    const total = await prisma.favorito.count({
      where: {
        usuario_id,
        estado_lectura: 'leido',
      },
    });

    return {
      libros_leidos: total,
    };
  },

  // ==========================================
  // SAB-91: CONSULTAR PROGRESO
  // ==========================================

  async getReadingProgress(
    usuario_id: number,
    libro_id: number
  ): Promise<ReadingProgressRecord> {
    const libro = await prisma.libro.findUnique({
      where: {
        libro_id,
      },
      select: {
        libro_id: true,
        paginas_totales: true,
      },
    });

    if (!libro) {
      throw new ReadingProgressError(
        'Libro no encontrado',
        404
      );
    }

    const registro = await prisma.favorito.findUnique({
      where: {
        usuario_id_libro_id: {
          usuario_id,
          libro_id,
        },
      },
      select: {
        current_page: true,
      },
    });

    const pagina_actual = registro?.current_page ?? 0;
    const paginas_totales = libro.paginas_totales ?? 0;

    const porcentaje =
      paginas_totales > 0
        ? Math.round(
            (pagina_actual / paginas_totales) * 100
          )
        : 0;

    return {
      libro_id,
      pagina_actual,
      paginas_totales,
      porcentaje,
    };
  },

  // ==========================================
  // SAB-91: ACTUALIZAR PROGRESO
  // ==========================================

  async updateReadingProgress(
    usuario_id: number,
    libro_id: number,
    pagina_actual: number
  ): Promise<ReadingProgressRecord> {
    if (
      !Number.isInteger(pagina_actual) ||
      pagina_actual < 0
    ) {
      throw new ReadingProgressError(
        'La página actual debe ser un entero mayor o igual a 0',
        400
      );
    }

    const libro = await prisma.libro.findUnique({
      where: {
        libro_id,
      },
      select: {
        libro_id: true,
        paginas_totales: true,
      },
    });

    if (!libro) {
      throw new ReadingProgressError(
        'Libro no encontrado',
        404
      );
    }

    const paginas_totales = libro.paginas_totales;

    if (
      paginas_totales === null ||
      paginas_totales <= 0
    ) {
      throw new ReadingProgressError(
        'El libro no tiene un total de páginas válido',
        400
      );
    }

    if (pagina_actual > paginas_totales) {
      throw new ReadingProgressError(
        `La página no puede superar el total de ${paginas_totales}`,
        400
      );
    }

    // Upsert: permite guardar progreso aunque
    // el libro no esté marcado como favorito.
    // No modifica estado_lectura ni fecha_estado.
    const registro = await prisma.favorito.upsert({
      where: {
        usuario_id_libro_id: {
          usuario_id,
          libro_id,
        },
      },
      update: {
        current_page: pagina_actual,
      },
      create: {
        usuario_id,
        libro_id,
        es_favorito: false,
        current_page: pagina_actual,
      },
      select: {
        current_page: true,
      },
    });

    const porcentaje = Math.round(
      (registro.current_page / paginas_totales) * 100
    );

    return {
      libro_id,
      pagina_actual: registro.current_page,
      paginas_totales,
      porcentaje,
    };
  },

  // ==========================================
  // SAB-87 + SAB-91: ELIMINAR FAVORITO
  // ==========================================

  async deleteFavorite(
    usuario_id: number,
    libro_id: number
  ): Promise<boolean> {
    const where = {
      usuario_id_libro_id: {
        usuario_id,
        libro_id,
      },
    };

    const actual = await prisma.favorito.findUnique({
      where,
      select: {
        estado_lectura: true,
        es_favorito: true,
        current_page: true,
      },
    });

    if (!actual || !actual.es_favorito) {
      return false;
    }

    // Eliminar la fila únicamente si no
    // tiene estado ni progreso guardado.
    if (
      actual.estado_lectura === ESTADO_GENERAL &&
      actual.current_page === 0
    ) {
      await prisma.favorito.delete({
        where,
      });

      return true;
    }

    // Quitar el corazón conservando estado y páginas.
    await prisma.favorito.update({
      where,
      data: {
        es_favorito: false,
      },
    });

    return true;
  },
};
