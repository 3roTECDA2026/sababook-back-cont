// src/models/medal.model.ts
import { db } from '../db/connect/db.js';

/*
medalla_id 
Para libros 2
foros 1 
*/

interface CountResult {
  count: string; // COUNT(*) de Postgres viene como string, no number
}

interface Medalla {
  medalla_id: number;
  nombre: string;
  descripcion: string;
  tipo_accion: string;
}

class MedalModel {
  async verificarYAsignarMedallas(usuario_id: number): Promise<void> {
    try {
      // Verificar cantidad de opiniones
      const { count: cantidadOpiniones } = await db.one<CountResult>(`
        SELECT COUNT(*) FROM opinion WHERE usuario_id = $1
      `, [usuario_id]);

      console.log('cantidadOpiniones', cantidadOpiniones);

      if (parseInt(cantidadOpiniones, 10) >= 1) {
        await this.asignarMedallaSiNoTiene(usuario_id, 6); // medalla_id para 'Opinador' de libros
      }
      if (parseInt(cantidadOpiniones, 10) >= 10) {
        await this.asignarMedallaSiNoTiene(usuario_id, 1); // medalla_id para 'Debatiente' de libros
      }

      // Verificar cantidad de participaciones en foros
      const { count: cantidadForos } = await db.one<CountResult>(`
        SELECT COUNT(*) FROM comentario_foro WHERE usuario_id = $1
      `, [usuario_id]);

      if (parseInt(cantidadForos, 10) >= 1) {
        await this.asignarMedallaSiNoTiene(usuario_id, 5); // medalla_id para 'Comentador' de foros
      }
      if (parseInt(cantidadForos, 10) >= 10) {
        await this.asignarMedallaSiNoTiene(usuario_id, 2); // medalla_id para 'Comentador Activo' de foros
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error al verificar o asignar medallas:', message);
    }
  }

  async asignarMedallaSiNoTiene(usuario_id: number, medalla_id: number): Promise<void> {
    // Verifica si el usuario ya tiene la medalla
    const yaTiene = await db.oneOrNone(`
      SELECT * FROM usuario_medalla WHERE usuario_id = $1 AND medalla_id = $2
    `, [usuario_id, medalla_id]);

    console.log('yaTiene', yaTiene, usuario_id, medalla_id);

    if (!yaTiene) {
      await db.none(`
        INSERT INTO usuario_medalla (usuario_id, medalla_id)
        VALUES ($1, $2)
      `, [usuario_id, medalla_id]);

      console.log(`✅ Medalla id ${medalla_id} asignada al usuario ${usuario_id}`);
    }
  }

  // Obtener todas las medallas de un usuario
  async obtenerMedallasPorUsuario(usuario_id: number): Promise<Medalla[]> {
    try {
      const medallas = await db.any<Medalla>(`
        SELECT m.medalla_id, m.nombre, m.descripcion, m.tipo_accion
        FROM medalla m
        INNER JOIN usuario_medalla um ON m.medalla_id = um.medalla_id
        WHERE um.usuario_id = $1
      `, [usuario_id]);
      return medallas;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error al obtener medallas del usuario:', message);
      throw error;
    }
  }
}

export const medalModel = new MedalModel();