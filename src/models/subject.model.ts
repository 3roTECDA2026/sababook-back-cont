// src/models/subject.model.ts
import { prisma } from '../db/connect/db';

export interface Materia {
  materia_id: number;
  nombre: string;
}

export const obtenerMateriasDB = async (): Promise<Materia[]> => {
  return await prisma.materia.findMany({
    orderBy: { nombre: 'asc' },
  });
};

export const obtenerMateriaPorIdDB = async (materia_id: number): Promise<Materia | null> => {
  return await prisma.materia.findUnique({
    where: { materia_id },
  });
};

export const crearMateriaDB = async (nombre: string): Promise<Materia> => {
  return await prisma.materia.create({
    data: { nombre },
  });
};

export const actualizarMateriaDB = async (materia_id: number, nombre: string): Promise<Materia> => {
  return await prisma.materia.update({
    where: { materia_id },
    data: { nombre },
  });
};

export const eliminarMateriaDB = async (materia_id: number): Promise<void> => {
  await prisma.materia.delete({
    where: { materia_id },
  });
};