// src/controllers/subject.controller.ts
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { subjectService } from '../services/subject.service';
import { AuthRequest } from '../middleware/auth.middleware';

// Convierte el parámetro :id en un número entero positivo, o null si no es válido
const parsearId = (valor: unknown): number | null => {
  const id = parseInt(String(valor), 10);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// Valida el nombre recibido en el body
const validarNombre = (nombre: unknown): string | null => {
  if (typeof nombre !== 'string' || nombre.trim().length === 0) {
    return 'El nombre de la materia es obligatorio.';
  }
  if (nombre.trim().length > 100) {
    return 'El nombre de la materia no puede superar los 100 caracteres.';
  }
  return null;
};

export const obtenerMaterias = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const materias = await subjectService.obtenerTodas();
    res.status(200).json(materias);
  } catch (error) {
    console.error('Error al obtener las materias:', error);
    res.status(500).json({ error: 'Error interno al obtener las materias.' });
  }
};

export const obtenerMateria = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parsearId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'El ID de la materia no es válido.' });
    return;
  }

  try {
    const materia = await subjectService.obtenerPorId(id);
    if (!materia) {
      res.status(404).json({ error: 'Materia no encontrada.' });
      return;
    }
    res.status(200).json(materia);
  } catch (error) {
    console.error('Error al obtener la materia:', error);
    res.status(500).json({ error: 'Error interno al obtener la materia.' });
  }
};

export const crearMateria = async (req: AuthRequest, res: Response): Promise<void> => {
  const errorNombre = validarNombre(req.body?.nombre);
  if (errorNombre) {
    res.status(400).json({ error: errorNombre });
    return;
  }

  try {
    const materia = await subjectService.crear(req.body.nombre);
    res.status(201).json(materia);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'Ya existe una materia con ese nombre.' });
      return;
    }
    console.error('Error al crear la materia:', error);
    res.status(500).json({ error: 'Error interno al crear la materia.' });
  }
};

export const actualizarMateria = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parsearId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'El ID de la materia no es válido.' });
    return;
  }

  const errorNombre = validarNombre(req.body?.nombre);
  if (errorNombre) {
    res.status(400).json({ error: errorNombre });
    return;
  }

  try {
    const materia = await subjectService.actualizar(id, req.body.nombre);
    res.status(200).json(materia);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Materia no encontrada.' });
        return;
      }
      if (error.code === 'P2002') {
        res.status(409).json({ error: 'Ya existe una materia con ese nombre.' });
        return;
      }
    }
    console.error('Error al actualizar la materia:', error);
    res.status(500).json({ error: 'Error interno al actualizar la materia.' });
  }
};

export const eliminarMateria = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parsearId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'El ID de la materia no es válido.' });
    return;
  }

  try {
    await subjectService.eliminar(id);
    res.status(200).json({ message: 'Materia eliminada correctamente.' });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Materia no encontrada.' });
        return;
      }
      // P2003: la materia está referenciada por cursos existentes
      if (error.code === 'P2003') {
        res.status(409).json({ error: 'No se puede eliminar: hay cursos que usan esta materia.' });
        return;
      }
    }
    console.error('Error al eliminar la materia:', error);
    res.status(500).json({ error: 'Error interno al eliminar la materia.' });
  }
};

export default { obtenerMaterias, obtenerMateria, crearMateria, actualizarMateria, eliminarMateria };