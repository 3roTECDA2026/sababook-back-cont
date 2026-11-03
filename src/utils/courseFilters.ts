// src/utils/courseFilters.ts
import { prisma } from '../db/connect/db';
import { getPositiveIntParam, QueryParamError } from './queryParams';

// SAB-060: filtros de año de cursada, curso y año lectivo (GET /users y GET /libros/buscar)
export interface CourseFilters {
  anio_lectivo?: number;
  anio?: number;
  curso_id?: number;
}

export const getCourseFilters = async (
  query: Record<string, unknown>
): Promise<CourseFilters> => {
  const anio = getPositiveIntParam(query, 'anio');
  const curso_id = getPositiveIntParam(query, 'curso_id');
  const anio_lectivo = getPositiveIntParam(query, 'anio_lectivo');

  // Con curso_id, el año y el año lectivo (si vienen) tienen que ser los del curso
  if (curso_id) {
    const curso = await prisma.curso.findUnique({
      where: { curso_id },
      select: { anio: true, anio_lectivo: true },
    });
    if (!curso) {
      throw new QueryParamError('El curso no existe.');
    }
    if ((anio && anio !== curso.anio) || (anio_lectivo && anio_lectivo !== curso.anio_lectivo)) {
      throw new QueryParamError('El curso no corresponde al año indicado.');
    }
    return { anio, curso_id, anio_lectivo };
  }

  // Sin anio_lectivo, el año de cursada se interpreta en el año lectivo más reciente
  // con cursos cargados (igual que el front), no en el año calendario.
  if (anio && !anio_lectivo) {
    const { _max } = await prisma.curso.aggregate({ _max: { anio_lectivo: true } });
    return { anio, anio_lectivo: _max.anio_lectivo ?? undefined };
  }

  return { anio, anio_lectivo };
};
