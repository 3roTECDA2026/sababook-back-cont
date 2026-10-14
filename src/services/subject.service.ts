// src/services/subject.service.ts
import {
  obtenerMateriasDB,
  obtenerMateriaPorIdDB,
  crearMateriaDB,
  actualizarMateriaDB,
  eliminarMateriaDB,
} from '../models/subject.model';

class SubjectService {
  async obtenerTodas() {
    return await obtenerMateriasDB();
  }

  async obtenerPorId(materia_id: number) {
    return await obtenerMateriaPorIdDB(materia_id);
  }

  async crear(nombre: string) {
    return await crearMateriaDB(nombre.trim());
  }

  async actualizar(materia_id: number, nombre: string) {
    return await actualizarMateriaDB(materia_id, nombre.trim());
  }

  async eliminar(materia_id: number) {
    await eliminarMateriaDB(materia_id);
  }
}

export const subjectService = new SubjectService();