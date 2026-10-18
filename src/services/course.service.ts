// src/services/course.service.ts
import {
  DatosCurso,
  FiltrosCursos,
  FiltrosHistorial,
  obtenerCursosDB,
  obtenerCursoPorIdDB,
  existeCursoDB,
  crearCursoDB,
  actualizarCursoDB,
  eliminarCursoDB,
  obtenerRolUsuarioDB,
  asignarDocenteDB,
  quitarDocenteDB,
  esDocenteDelCursoDB,
  obtenerHistorialDB,
  obtenerLibrosDelCursoDB,
  asignarLibroDB,
  actualizarPuntajeLibroDB,
  quitarLibroDB,
} from '../models/course.model';
import { TipoRol } from '@prisma/client';

// Error con código HTTP para reglas de negocio que no vienen de Prisma
export class ErrorNegocio extends Error {
  status: number;

  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.status = status;
  }
}

class CourseService {
  async obtenerTodos(filtros: FiltrosCursos) {
    return await obtenerCursosDB(filtros);
  }

  async obtenerPorId(curso_id: number) {
    return await obtenerCursoPorIdDB(curso_id);
  }

  async crear(datos: DatosCurso) {
    return await crearCursoDB(datos);
  }

  async actualizar(curso_id: number, datos: Partial<DatosCurso>) {
    return await actualizarCursoDB(curso_id, datos);
  }

  async eliminar(curso_id: number) {
    await eliminarCursoDB(curso_id);
  }

  // Solo se pueden asignar usuarios con rol docente
  async asignarDocente(curso_id: number, usuario_id: number) {
    const usuario = await obtenerRolUsuarioDB(usuario_id);
    if (!usuario) {
      throw new ErrorNegocio(404, 'Usuario no encontrado.');
    }
    if (usuario.rol !== TipoRol.DOCENTE) {
      throw new ErrorNegocio(400, 'El usuario indicado no tiene rol docente.');
    }
    return await asignarDocenteDB(curso_id, usuario_id);
  }

  async quitarDocente(curso_id: number, usuario_id: number) {
    await quitarDocenteDB(curso_id, usuario_id);
  }

  // El administrador gestiona los libros de cualquier curso;
  // el docente, solo los de los cursos que tiene asignados
  private async verificarPermisoLibros(curso_id: number, usuario_id?: number) {
    if (!usuario_id) {
      throw new ErrorNegocio(401, 'Autenticación requerida.');
    }

    const usuario = await obtenerRolUsuarioDB(usuario_id);
    if (usuario?.rol === TipoRol.ADMINISTRADOR) return;

    if (usuario?.rol === TipoRol.DOCENTE && (await esDocenteDelCursoDB(curso_id, usuario_id))) {
      return;
    }

    throw new ErrorNegocio(
      403,
      'Acceso denegado. Solo el administrador o un docente del curso pueden gestionar sus libros.'
    );
  }

  // El administrador ve el historial de todos los cursos;
  // el docente, solo el de los cursos donde está asignado
  async obtenerHistorial(filtros: FiltrosHistorial, usuario_id?: number) {
    if (!usuario_id) {
      throw new ErrorNegocio(401, 'Autenticación requerida.');
    }

    const usuario = await obtenerRolUsuarioDB(usuario_id);
    if (usuario?.rol !== TipoRol.ADMINISTRADOR && usuario?.rol !== TipoRol.DOCENTE) {
      throw new ErrorNegocio(
        403,
        'Acceso denegado. Solo administradores y docentes pueden ver el historial de asignaciones.'
      );
    }

    if (usuario?.rol === TipoRol.DOCENTE) {
      return await obtenerHistorialDB({ ...filtros, docente_id: usuario_id });
    }

    return await obtenerHistorialDB(filtros);
  }

  async obtenerLibros(curso_id: number) {
    if (!(await existeCursoDB(curso_id))) {
      throw new ErrorNegocio(404, 'Curso no encontrado.');
    }
    return await obtenerLibrosDelCursoDB(curso_id);
  }

  async asignarLibro(curso_id: number, libro_id: number, puntaje: number, usuario_id?: number) {
    await this.verificarPermisoLibros(curso_id, usuario_id);
    return await asignarLibroDB(curso_id, libro_id, puntaje, usuario_id);
  }

  async actualizarPuntajeLibro(
    curso_id: number,
    libro_id: number,
    puntaje: number,
    usuario_id?: number
  ) {
    await this.verificarPermisoLibros(curso_id, usuario_id);
    return await actualizarPuntajeLibroDB(curso_id, libro_id, puntaje, usuario_id);
  }

  async quitarLibro(curso_id: number, libro_id: number, usuario_id?: number) {
    await this.verificarPermisoLibros(curso_id, usuario_id);
    await quitarLibroDB(curso_id, libro_id, usuario_id);
  }
}

export const courseService = new CourseService();