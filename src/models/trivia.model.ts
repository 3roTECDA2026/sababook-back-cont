// src/models/trivia.model.ts
import { prisma } from '../db/connect/db';

export type TriviaModo = 'trivia' | 'evaluacion';
export type TriviaFormato = 'multiple' | 'truefalse' | 'conexion' | 'completar';

export interface TriviaPar {
  left: string;
  right: string;
}

export interface TriviaQuestion {
  id: number;
  mode: TriviaModo;
  format: TriviaFormato;
  question: string;
  deadline: string | null;
  evaluationId?: number | null;
  options?: string[];
  correctAnswer?: number;
  pairs?: TriviaPar[];
  text?: string;
  answers?: string[];
}

export interface CreateTriviaData {
  bookId: number;
  evaluationId?: number | null;
  mode: TriviaModo;
  format: TriviaFormato;
  question?: string;
  deadline?: string | null;
  options?: string[];
  correctAnswer?: number;
  pairs?: TriviaPar[];
  text?: string;
  answers?: string[];
}

export interface Evaluacion {
  evaluationId: number;
  bookId: number;
  deadline: string | null;
  createdAt: string;
  questionCount: number;
}

// Prisma, opciones e hijos tipados a partir del modelo generado
type TriviaRow = Awaited<ReturnType<typeof prisma.trivia_pregunta.findFirst>>;

const toISODate = (date: Date | null | undefined): string | null =>
  date ? date.toISOString().slice(0, 10) : null;

class TriviaModel {
  private mapToQuestion(row: Exclude<TriviaRow, null> & { opciones: any[]; pares: any[]; respuestas: any[] }): TriviaQuestion {
    const question: TriviaQuestion = {
      id: row.pregunta_id,
      mode: row.modo as TriviaModo,
      format: row.formato as TriviaFormato,
      question: row.formato === 'completar' ? '' : row.consigna,
      deadline: toISODate(row.fecha_limite),
      evaluationId: row.evaluacion_id,
    };

    if (row.formato === 'multiple' || row.formato === 'truefalse') {
      question.options = row.opciones.map((option) => option.texto);
      question.correctAnswer = row.opciones.findIndex((option) => option.es_correcta === true);
    }
    if (row.formato === 'conexion') {
      question.pairs = row.pares.map((pair) => ({
        left: pair.izquierda,
        right: pair.derecha,
      }));
    }
    if (row.formato === 'completar') {
      question.text = row.consigna;
      question.answers = row.respuestas.map((respuesta) => respuesta.texto);
    }

    return question;
  }

  async getByBook(bookId: number): Promise<TriviaQuestion[]> {
    try {
      const rows = await prisma.trivia_pregunta.findMany({
        where: { libro_id: bookId },
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
      console.error('Error TriviaModel.getByBook:', message);
      throw new Error('Failed to retrieve trivia questions.');
    }
  }

  async create(data: CreateTriviaData): Promise<TriviaQuestion> {
    const { bookId, evaluationId, mode, format, question, deadline, options, correctAnswer, pairs, text, answers } = data;
    const prompt = format === 'completar' ? (text ?? '') : (question ?? '');

    const createData: any = {
      libro_id: bookId,
      evaluacion_id: evaluationId || null,
      modo: mode,
      formato: format,
      consigna: prompt,
      fecha_limite: deadline ? new Date(`${deadline}T00:00:00Z`) : null,
    };

    if (format === 'multiple' || format === 'truefalse') {
      createData.opciones = {
        create: (options ?? []).map((optionText, index) => ({
          texto: optionText,
          es_correcta: mode === 'evaluacion' ? index === correctAnswer : null,
        })),
      };
    }
    if (format === 'conexion') {
      createData.pares = {
        create: (pairs ?? []).map((pair, index) => ({
          orden: index,
          izquierda: pair.left,
          derecha: pair.right,
        })),
      };
    }
    if (format === 'completar') {
      createData.respuestas = {
        create: (answers ?? []).map((answerText, index) => ({
          orden: index,
          texto: answerText,
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

  async delete(questionId: number): Promise<boolean> {
    try {
      await prisma.trivia_pregunta.delete({
        where: { pregunta_id: questionId },
      });
      return true;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error(`Trivia question ${questionId} not found.`);
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error TriviaModel.delete:', message);
      throw error;
    }
  }

  async getEvaluationsByBook(bookId: number): Promise<Evaluacion[]> {
    try {
      const rows = await prisma.trivia_evaluacion.findMany({
        where: { libro_id: bookId },
        include: {
          _count: { select: { trivia_pregunta: true } },
        },
        orderBy: { fecha_creacion: 'desc' },
      });

      return rows.map((row) => ({
        evaluationId: row.evaluacion_id,
        bookId: row.libro_id,
        deadline: toISODate(row.fecha_limite),
        createdAt: row.fecha_creacion.toISOString(),
        questionCount: row._count.trivia_pregunta,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error TriviaModel.getEvaluationsByBook:', message);
      throw new Error('Failed to retrieve evaluations.');
    }
  }

  async createEvaluation(bookId: number, deadline?: string | null): Promise<Evaluacion> {
    try {
      const created = await prisma.trivia_evaluacion.create({
        data: {
          libro_id: bookId,
          fecha_limite: deadline ? new Date(`${deadline}T00:00:00Z`) : null,
        },
        include: {
          _count: { select: { trivia_pregunta: true } },
        },
      });

      return {
        evaluationId: created.evaluacion_id,
        bookId: created.libro_id,
        deadline: toISODate(created.fecha_limite),
        createdAt: created.fecha_creacion.toISOString(),
        questionCount: created._count.trivia_pregunta,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error TriviaModel.createEvaluation:', message);
      throw error;
    }
  }

  async getEvaluationById(evaluationId: number): Promise<{ evaluation: Evaluacion; questions: TriviaQuestion[] } | null> {
    try {
      const row = await prisma.trivia_evaluacion.findUnique({
        where: { evaluacion_id: evaluationId },
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
        evaluation: {
          evaluationId: row.evaluacion_id,
          bookId: row.libro_id,
          deadline: toISODate(row.fecha_limite),
          createdAt: row.fecha_creacion.toISOString(),
          questionCount: row._count.trivia_pregunta,
        },
        questions: row.trivia_pregunta.map((question) =>
          this.mapToQuestion(
            question as Exclude<TriviaRow, null> & { opciones: any[]; pares: any[]; respuestas: any[] },
          ),
        ),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error TriviaModel.getEvaluationById:', message);
      throw new Error('Failed to retrieve evaluation.');
    }
  }
}

export const triviaModel = new TriviaModel();