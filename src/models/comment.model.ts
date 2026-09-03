// src/models/comment.model.ts
import { db } from '../db/connect/db.js';

interface ComentarioForo {
  comentario_id: number;
  foro_id: number;
  usuario_id: number;
  contenido: string;
  fecha: Date;
}

interface ComentarioConUsuario extends ComentarioForo {
  nombre: string;
  email: string;
}

export const insertarComentario = async (
  foro_id: number,
  usuario_id: number,
  contenido: string
): Promise<{ comentario_id: number }> => {
  try {
    const sql = `
      INSERT INTO comentario_foro (foro_id, usuario_id, contenido)
      VALUES ($1, $2, $3)
      RETURNING comentario_id
    `;

    return await db.one<{ comentario_id: number }>(sql, [foro_id, usuario_id, contenido]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error OpinionModel.createOpinion:', message);
    throw error;
  }
};

export const obtenerComentariosPorForo = async (foro_id: number): Promise<ComentarioConUsuario[]> => {
  return await db.any<ComentarioConUsuario>(`
      SELECT cf.*, u.usuario_id, u.nombre, u.email
      FROM comentario_foro cf
      INNER JOIN usuario u ON cf.usuario_id = u.usuario_id
      WHERE cf.foro_id = ${foro_id}
      ORDER BY cf.fecha ASC
    `);
};

export const obtenerTodosComentarios = async (): Promise<ComentarioForo[]> => {
  return await db.any<ComentarioForo>(`SELECT * FROM comentario_foro ORDER BY fecha ASC`);
};

export const obtenerComentarioPorId = async (comentario_id: number): Promise<ComentarioForo | undefined> => {
  const result = await db.any<ComentarioForo>(`
    SELECT * FROM comentario_foro WHERE comentario_id = ${comentario_id}
  `);
  return result[0];
};

export const actualizarComentarioPorId = async (
  comentario_id: number,
  contenido: string
): Promise<{ comentario_id: number }> => {
  const sql = `
    UPDATE comentario_foro
    SET contenido = $1
    WHERE comentario_id = $2
    RETURNING comentario_id
  `;
  return await db.one<{ comentario_id: number }>(sql, [contenido, comentario_id]);
};

export const eliminarComentarioPorId = async (comentario_id: number): Promise<{ comentario_id: number }> => {
  const sql = `
    DELETE FROM comentario_foro
    WHERE comentario_id = $1
    RETURNING comentario_id
  `;
  return await db.one<{ comentario_id: number }>(sql, [comentario_id]);
};