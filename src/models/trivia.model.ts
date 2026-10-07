// src/models/trivia.model.ts
import { prisma } from '../db/connect/db';

export type TriviaModo = 'trivia' | 'evaluacion';
export type TriviaFormato = 'multiple' | 'truefalse' | 'conexion' | 'completar';

export type TriviaPar = {
  left: string;
  right: string;
};

export interface TriviaQuestion {
  id: number;
  mode: TriviaModo;
  format: TriviaFormato;
  question: string;
  deadline: string | null;
  evaluationId?: number | null;
  cursoId?: number | null;
  docenteId?: number | null;
  options?: string[];
  correctAnswer?: number;
  pairs?: TriviaPar[];
  text?: string;
  answers?: string[];
}

export interface CreateTriviaData {
  bookId: number;
  evaluationId?: number | null;
  cursoId?: number | null;
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
  cursoId?: number | null;
  docenteId?: number | null;
  deadline: string | null;
  createdAt: string;
  questionCount: number;
}

export type PlayQuestion = {
  id: number;
  mode: TriviaModo;
  format: TriviaFormato;
  question: string;
  deadline?: string | null;
  text?: string;
  options?: string[];
  lefts?: string[];
  rights?: string[];
  wordBank?: string[];
};

export type PlayAnswer =
  | { optionIndex: number }
  | { pairs: { left: string; right: string }[] }
  | { texts: string[] };

export type PlayAnswerEntry = {
  questionId: number;
  answer: PlayAnswer;
};

export type PlayCheckResult = {
  questionId: number;
  correct: boolean;
  solution: PlayAnswer | null;
};

export type PlayCheckResponse = {
  total: number;
  correctCount: number;
  percentage: number;
  results: PlayCheckResult[];
};

export interface TriviaAttempt {
  attemptId: number;
  evaluationId: number;
  userId: number;
  studentName: string;
  correctCount: number;
  total: number;
  percentage: number;
  submittedAt: string;
  payload: { questions: PlayQuestion[]; answers: PlayAnswerEntry[]; result: PlayCheckResponse };
}

// Prisma, opciones e hijos tipados a partir del modelo generado
type TriviaRow = Awaited<ReturnType<typeof prisma.trivia_pregunta.findFirst>>;

const toISODate = (date: Date | null | undefined): string | null =>
  date ? date.toISOString().slice(0, 10) : null;

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const shuffle = <T>(values: T[]): T[] => {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

class TriviaModel {
  private mapToQuestion(row: Exclude<TriviaRow, null> & { opciones: any[]; pares: any[]; respuestas: any[] }): TriviaQuestion {
    const question: TriviaQuestion = {
      id: row.pregunta_id,
      mode: row.modo as TriviaModo,
      format: row.formato as TriviaFormato,
      question: row.formato === 'completar' ? '' : row.consigna,
      deadline: toISODate(row.fecha_limite),
      evaluationId: row.evaluacion_id,
      cursoId: row.curso_id,
      docenteId: row.docente_id,
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

  async create(data: CreateTriviaData, docenteId: number): Promise<TriviaQuestion> {
    const { bookId, evaluationId, cursoId, mode, format, question, deadline, options, correctAnswer, pairs, text, answers } = data;
    const prompt = format === 'completar' ? (text ?? '') : (question ?? '');

    const createData: any = {
      libro_id: bookId,
      evaluacion_id: evaluationId || null,
      curso_id: cursoId || null,
      docente_id: docenteId,
      modo: mode,
      formato: format,
      consigna: prompt,
      fecha_limite: deadline ? new Date(`${deadline}T00:00:00Z`) : null,
    };

    if (format === 'multiple' || format === 'truefalse') {
      createData.opciones = {
        create: (options ?? []).map((optionText, index) => ({
          texto: optionText,
          es_correcta: index === correctAnswer,
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

  async getById(questionId: number): Promise<TriviaQuestion | null> {
    try {
      const row = await prisma.trivia_pregunta.findUnique({
        where: { pregunta_id: questionId },
        include: {
          opciones: { orderBy: { opcion_id: 'asc' } },
          pares: { orderBy: { orden: 'asc' } },
          respuestas: { orderBy: { orden: 'asc' } },
        },
      });

      if (!row) return null;

      return this.mapToQuestion(
        row as Exclude<TriviaRow, null> & { opciones: any[]; pares: any[]; respuestas: any[] },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error TriviaModel.getById:', message);
      throw new Error('Failed to retrieve trivia question.');
    }
  }

  async getByCourse(cursoId: number): Promise<TriviaQuestion[]> {
    try {
      const rows = await prisma.trivia_pregunta.findMany({
        where: { curso_id: cursoId },
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
      console.error('Error TriviaModel.getByCourse:', message);
      throw new Error('Failed to retrieve course trivia questions.');
    }
  }

  async getEvaluationsByCourse(cursoId: number): Promise<Evaluacion[]> {
    try {
      const rows = await prisma.trivia_evaluacion.findMany({
        where: { curso_id: cursoId },
        include: {
          _count: { select: { trivia_pregunta: true } },
        },
        orderBy: { fecha_creacion: 'desc' },
      });

      return rows.map((row) => ({
        evaluationId: row.evaluacion_id,
        bookId: row.libro_id,
        cursoId: row.curso_id,
        docenteId: row.docente_id,
        deadline: toISODate(row.fecha_limite),
        createdAt: row.fecha_creacion.toISOString(),
        questionCount: row._count.trivia_pregunta,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error TriviaModel.getEvaluationsByCourse:', message);
      throw new Error('Failed to retrieve course evaluations.');
    }
  }

  async isDocenteDeCurso(userId: number, cursoId: number): Promise<boolean> {
    try {
      const row = await prisma.curso_docente.findUnique({
        where: { curso_id_usuario_id: { curso_id: cursoId, usuario_id: userId } },
      });
      return !!row;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error TriviaModel.isDocenteDeCurso:', message);
      throw error;
    }
  }

  async isInscripto(cursoId: number, userId: number): Promise<boolean> {
    try {
      const row = await prisma.inscripcion.findFirst({
        where: { curso_id: cursoId, usuario_id: userId },
      });
      return !!row;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error TriviaModel.isInscripto:', message);
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

  async createEvaluation(
    bookId: number,
    deadline?: string | null,
    cursoId?: number | null,
    docenteId?: number,
  ): Promise<Evaluacion> {
    try {
      const created = await prisma.trivia_evaluacion.create({
        data: {
          libro_id: bookId,
          curso_id: cursoId || null,
          docente_id: docenteId ?? null,
          fecha_limite: deadline ? new Date(`${deadline}T00:00:00Z`) : null,
        },
        include: {
          _count: { select: { trivia_pregunta: true } },
        },
      });

      return {
        evaluationId: created.evaluacion_id,
        bookId: created.libro_id,
        cursoId: created.curso_id,
        docenteId: created.docente_id,
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

  private toPlayQuestion(question: TriviaQuestion): PlayQuestion {
    if (question.format === 'conexion') {
      return {
        id: question.id,
        mode: question.mode,
        format: question.format,
        question: question.question,
        lefts: (question.pairs ?? []).map((pair) => pair.left),
        rights: shuffle((question.pairs ?? []).map((pair) => pair.right)),
      };
    }

    const playQuestion: PlayQuestion = {
      id: question.id,
      mode: question.mode,
      format: question.format,
      question: question.format === 'completar' ? '' : question.question,
    };

    if (question.format === 'multiple' || question.format === 'truefalse') {
      playQuestion.options = question.options ?? [];
    }
    if (question.format === 'completar') {
      playQuestion.text = question.text;
      playQuestion.deadline = question.deadline;
      playQuestion.wordBank = shuffle(question.answers ?? []);
    }

    return playQuestion;
  }

  async getTriviaForPlay(bookId: number): Promise<PlayQuestion[]> {
    try {
      const rows = await prisma.trivia_pregunta.findMany({
        where: { libro_id: bookId, modo: 'trivia' },
        include: {
          opciones: { orderBy: { opcion_id: 'asc' } },
          pares: { orderBy: { orden: 'asc' } },
          respuestas: { orderBy: { orden: 'asc' } },
        },
        orderBy: { pregunta_id: 'asc' },
      });

      return rows.map((row) =>
        this.toPlayQuestion(
          this.mapToQuestion(row as Exclude<TriviaRow, null> & { opciones: any[]; pares: any[]; respuestas: any[] }),
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error TriviaModel.getTriviaForPlay:', message);
      throw new Error('Failed to retrieve playable trivia.');
    }
  }

  async getEvaluationForPlay(evaluationId: number): Promise<PlayQuestion[]> {
    try {
      const rows = await prisma.trivia_pregunta.findMany({
        where: { evaluacion_id: evaluationId },
        include: {
          opciones: { orderBy: { opcion_id: 'asc' } },
          pares: { orderBy: { orden: 'asc' } },
          respuestas: { orderBy: { orden: 'asc' } },
        },
        orderBy: { pregunta_id: 'asc' },
      });

      return rows.map((row) =>
        this.toPlayQuestion(
          this.mapToQuestion(row as Exclude<TriviaRow, null> & { opciones: any[]; pares: any[]; respuestas: any[] }),
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error TriviaModel.getEvaluationForPlay:', message);
      throw new Error('Failed to retrieve playable evaluation.');
    }
  }

  async checkAnswers(answers: PlayAnswerEntry[]): Promise<PlayCheckResponse> {
    const ids = answers.map((entry) => entry.questionId);
    const rows = await prisma.trivia_pregunta.findMany({
      where: { pregunta_id: { in: ids } },
      include: {
        opciones: true,
        pares: true,
        respuestas: true,
      },
    });
    const byId = new Map(rows.map((row) => [row.pregunta_id, row]));

    const results: PlayCheckResult[] = answers.map(({ questionId, answer }) => {
      const row = byId.get(questionId);
      if (!row) {
        return { questionId, correct: false, solution: null };
      }

      let correct = false;
      let solution: PlayAnswer | null = null;

      if (row.formato === 'multiple' || row.formato === 'truefalse') {
        const correctIndex = row.opciones.findIndex((opcion) => opcion.es_correcta === true);
        const submittedIndex = (answer as { optionIndex?: number } | undefined)?.optionIndex;
        if (correctIndex >= 0) {
          solution = { optionIndex: correctIndex };
          correct = typeof submittedIndex === 'number' && submittedIndex === correctIndex;
        }
      } else if (row.formato === 'conexion') {
        const originalPairs = row.pares.map((par) => ({ left: par.izquierda, right: par.derecha }));
        const submittedPairs = (answer as { pairs?: { left: string; right: string }[] } | undefined)?.pairs ?? [];
        solution = { pairs: originalPairs };
        correct =
          submittedPairs.length === originalPairs.length &&
          originalPairs.every((pair) =>
            submittedPairs.some(
              (submitted) =>
                normalize(submitted.left) === normalize(pair.left) &&
                normalize(submitted.right) === normalize(pair.right),
            ),
          );
      } else if (row.formato === 'completar') {
        const expected = row.respuestas.map((respuesta) => respuesta.texto);
        const submittedTexts = (answer as { texts?: string[] } | undefined)?.texts ?? [];
        solution = { texts: expected };
        correct =
          submittedTexts.length === expected.length &&
          expected.every((expectedText, index) => normalize(submittedTexts[index] ?? '') === normalize(expectedText));
      }

      return { questionId, correct, solution };
    });

    const total = results.length;
    const correctCount = results.filter((result) => result.correct).length;

    return {
      total,
      correctCount,
      percentage: total > 0 ? Math.round((correctCount * 100) / total) : 0,
      results,
    };
  }

  async getAttempt(evaluationId: number, userId: number): Promise<TriviaAttempt | null> {
    const row = await prisma.triviaAttempt.findUnique({
      where: { evaluationUserAttempt: { evaluationId, userId } },
      include: { user: { select: { nombre: true, email: true } } },
    });
    if (!row) return null;
    return this.mapAttempt(row);
  }

  async saveAttempt(payload: {
    evaluationId: number;
    userId: number;
    questions: PlayQuestion[];
    answers: PlayAnswerEntry[];
    result: PlayCheckResponse;
  }): Promise<TriviaAttempt> {
    try {
      const created = await prisma.triviaAttempt.create({
        data: {
          evaluationId: payload.evaluationId,
          userId: payload.userId,
          correctCount: payload.result.correctCount,
          totalQuestions: payload.result.total,
          score: payload.result.percentage,
          answersJson: {
            questions: payload.questions,
            answers: payload.answers,
            result: payload.result,
          },
        },
        include: { user: { select: { nombre: true, email: true } } },
      });
      return this.mapAttempt(created);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new Error('This evaluation has already been answered by this user.');
      }
      console.error('Error TriviaModel.saveAttempt:', error);
      throw error;
    }
  }

  async getAttemptsByEvaluation(evaluationId: number): Promise<TriviaAttempt[]> {
    const rows = await prisma.triviaAttempt.findMany({
      where: { evaluationId },
      include: { user: { select: { nombre: true, email: true } } },
      orderBy: { submittedAt: 'asc' },
    });
    return rows.map((row) => this.mapAttempt(row));
  }

  private mapAttempt(
    row: {
      attemptId: number;
      evaluationId: number;
      userId: number;
      correctCount: number;
      totalQuestions: number;
      score: number;
      answersJson: any;
      submittedAt: Date;
      user: { nombre: string; email: string };
    },
  ): TriviaAttempt {
    return {
      attemptId: row.attemptId,
      evaluationId: row.evaluationId,
      userId: row.userId,
      studentName: row.user.nombre,
      correctCount: row.correctCount,
      total: row.totalQuestions,
      percentage: row.score,
      submittedAt: row.submittedAt.toISOString(),
      payload: row.answersJson,
    };
  }
}

export const triviaModel = new TriviaModel();