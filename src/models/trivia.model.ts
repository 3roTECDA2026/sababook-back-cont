// src/models/trivia.model.ts
import { prisma } from '../db/connect/db';

export type TriviaModo = 'trivia' | 'evaluacion';
export type TriviaFormato = 'multiple' | 'truefalse' | 'conexion' | 'completar';

export interface TriviaPar {
  izquierda: string;
  derecha: string;
}

export interface TriviaQuestion {
  id: number;
  modo: TriviaModo;
  formato: TriviaFormato;
  pregunta: string;
  fechaLimite: string | null;
  evaluacion_id?: number | null;
  opciones?: string[];
  correcta?: number;
  pares?: TriviaPar[];
  texto?: string;
  respuestas?: string[];
}

export interface CreateTriviaData {
  libro_id: number;
  evaluacion_id?: number | null;
  modo: TriviaModo;
  formato: TriviaFormato;
  pregunta?: string;
  fechaLimite?: string | null;
  opciones?: string[];
  correcta?: number;
  pares?: TriviaPar[];
  texto?: string;
  respuestas?: string[];
}

export interface Evaluacion {
  evaluacion_id: number;
  libro_id: number;
  fecha_limite: string | null;
  fecha_creacion: string;
  cantidad_preguntas: number;
}

// Prisma, opciones e hijos tipados a partir del modelo generado
type TriviaRow = Awaited<ReturnType<typeof prisma.trivia_pregunta.findFirst>>;

const toISODate = (date: Date | null | undefined): string | null =>
  date ? date.toISOString().slice(0, 10) : null;

class TriviaModel {
  private mapToQuestion(row: Exclude<TriviaRow, null> & { opciones: any[]; pares: any[]; respuestas: any[] }): TriviaQuestion {
    const question: TriviaQuestion = {
      id: row.pregunta_id,
      modo: row.modo as TriviaModo,
      formato: row.formato as TriviaFormato,
      pregunta: row.formato === 'completar' ? '' : row.consigna,
      fechaLimite: toISODate(row.fecha_limite),
      evaluacion_id: row.evaluacion_id,
    };

    if (row.formato === 'multiple' || row.formato === 'truefalse') {
      question.opciones = row.opciones.map((opcion) => opcion.texto);
      question.correcta = row.opciones.findIndex((opcion) => opcion.es_correcta === true);
    }
    if (row.formato === 'conexion') {
      question.pares = row.pares.map((par) => ({
        izquierda: par.izquierda,
        derecha: par.derecha,
      }));
    }
    if (row.formato === 'completar') {
      question.texto = row.consigna;
      question.respuestas = row.respuestas.map((respuesta) => respuesta.texto);
    }

    return question;
  }

  async getByLibro(libroId: number): Promise<TriviaQuestion[]> {
    try {
      const rows = await prisma.trivia_pregunta.findMany({
        where: { libro_id: libroId },
        include: {
          opciones: { orderBy: { opcion_id: 'asc' } },
          pares: { orderBy: { orden: 'asc' } },
          respuestas: { orderBy: { orden: 'asc' } },
        },
        orderBy: { pregunta_id: 'desc' },
      });

      return rows.map((row) =>
        this.mapToQuestion(row as Exclude<TriviaRow, null> & { opciones: any[]; pares: any[]; respuestas: any[] }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error TriviaModel.getByLibro:', message);
      throw new Error('Failed to retrieve trivia questions.');
    }
  }

  async create(data: CreateTriviaData): Promise<TriviaQuestion> {
    const { libro_id, evaluacion_id, modo, formato, pregunta, fechaLimite, opciones, correcta, pares, texto, respuestas } = data;
    const consigna = formato === 'completar' ? (texto ?? '') : (pregunta ?? '');

    const createData: any = {
      libro_id,
      evaluacion_id: evaluacion_id || null,
      modo,
      formato,
      consigna,
      fecha_limite: fechaLimite ? new Date(`${fechaLimite}T00:00:00Z`) : null,
    };

    if (formato === 'multiple' || formato === 'truefalse') {
      createData.opciones = {
        create: (opciones ?? []).map((textoOpcion, index) => ({
          texto: textoOpcion,
          es_correcta: modo === 'evaluacion' ? index === correcta : null,
        })),
      };
    }
    if (formato === 'conexion') {
      createData.pares = {
        create: (pares ?? []).map((par, index) => ({
          orden: index,
          izquierda: par.izquierda,
          derecha: par.derecha,
        })),
      };
    }
    if (formato === 'completar') {
      createData.respuestas = {
        create: (respuestas ?? []).map((textoRespuesta, index) => ({
          orden: index,
          texto: textoRespuesta,
        })),
      };
    }

    try {
      const newQuestion = await prisma.trivia_pregunta.create({
        data: createData,
        include: {
          opciones: true,
          pares: true,
          respuestas: true,
        },
      });

      return this.mapToQuestion(
        newQuestion as Exclude<TriviaRow, null> & { opciones: any[]; pares: any[]; respuestas: any[] },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error TriviaModel.create:', message);
      throw error;
    }
  }

  async delete(preguntaId: number): Promise<boolean> {
    try {
      await prisma.trivia_pregunta.delete({
        where: { pregunta_id: preguntaId },
      });
      return true;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error(`Pregunta de trivia ${preguntaId} not found.`);
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error TriviaModel.delete:', message);
      throw error;
    }
  }

  async getEvaluacionesByLibro(libroId: number): Promise<Evaluacion[]> {
    try {
      const rows = await prisma.trivia_evaluacion.findMany({
        where: { libro_id: libroId },
        include: {
          _count: { select: { trivia_pregunta: true } },
        },
        orderBy: { fecha_creacion: 'desc' },
      });

      return rows.map((row) => ({
        evaluacion_id: row.evaluacion_id,
        libro_id: row.libro_id,
        fecha_limite: toISODate(row.fecha_limite),
        fecha_creacion: row.fecha_creacion.toISOString(),
        cantidad_preguntas: row._count.trivia_pregunta,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error TriviaModel.getEvaluacionesByLibro:', message);
      throw new Error('Failed to retrieve evaluaciones.');
    }
  }

  async createEvaluacion(libroId: number, fechaLimite?: string | null): Promise<Evaluacion> {
    try {
      const created = await prisma.trivia_evaluacion.create({
        data: {
          libro_id: libroId,
          fecha_limite: fechaLimite ? new Date(`${fechaLimite}T00:00:00Z`) : null,
        },
        include: {
          _count: { select: { trivia_pregunta: true } },
        },
      });

      return {
        evaluacion_id: created.evaluacion_id,
        libro_id: created.libro_id,
        fecha_limite: toISODate(created.fecha_limite),
        fecha_creacion: created.fecha_creacion.toISOString(),
        cantidad_preguntas: created._count.trivia_pregunta,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error TriviaModel.createEvaluacion:', message);
      throw error;
    }
  }

  async getEvaluacionById(evaluacionId: number): Promise<{ evaluacion: Evaluacion; preguntas: TriviaQuestion[] } | null> {
    try {
      const row = await prisma.trivia_evaluacion.findUnique({
        where: { evaluacion_id: evaluacionId },
        include: {
          _count: { select: { trivia_pregunta: true } },
          trivia_pregunta: {
            orderBy: { pregunta_id: 'asc' },
            include: {
              opciones: { orderBy: { opcion_id: 'asc' } },
              pares: { orderBy: { orden: 'asc' } },
              respuestas: { orderBy: { orden: 'asc' } },
            },
          },
        },
      });

      if (!row) return null;

      return {
        evaluacion: {
          evaluacion_id: row.evaluacion_id,
          libro_id: row.libro_id,
          fecha_limite: toISODate(row.fecha_limite),
          fecha_creacion: row.fecha_creacion.toISOString(),
          cantidad_preguntas: row._count.trivia_pregunta,
        },
        preguntas: row.trivia_pregunta.map((question) =>
          this.mapToQuestion(
            question as Exclude<TriviaRow, null> & { opciones: any[]; pares: any[]; respuestas: any[] },
          ),
        ),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error TriviaModel.getEvaluacionById:', message);
      throw new Error('Failed to retrieve evaluacion.');
    }
  }
}

export const triviaModel = new TriviaModel();