import { db } from '../db/connect/db.js';

// Crear un nuevo Café Literario y su foro asociado
export const crearCafeDB = async ({ titulo, descripcion, libro_id, docente_id, fecha_evento, lugar }) => {
  return await db.tx(async t => {
    // 1. Crear el Café Literario
    const cafe = await t.one(
      `INSERT INTO cafe_literario (titulo, descripcion, libro_id, docente_id, fecha_evento, lugar)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'Biblioteca Ernesto Sábato'))
       RETURNING *`,
      [titulo, descripcion, libro_id, docente_id, fecha_evento, lugar]
    );

    // 2. Crear automáticamente un Foro de Debate asociado al Café
    const foroTitulo = `Foro de Debate: ${titulo}`;
    const foroDesc = `Espacio de discusión y opiniones para el Café Literario sobre la lectura propuesta.`;
    const foro = await t.one(
      `INSERT INTO foro (titulo, descripcion, creador_id, cafe_id)
       VALUES ($1, $2, $3, $4)
       RETURNING foro_id`,
      [foroTitulo, foroDesc, docente_id, cafe.cafe_id]
    );

    return { ...cafe, foro_id: foro.foro_id };
  });
};

// Obtener todos los Cafés Literarios con información agregada (libro, docente, asistencias, votos)
export const obtenerCafesDB = async (usuario_id = null) => {
  return await db.any(`
    SELECT 
      c.cafe_id,
      c.titulo,
      c.descripcion,
      c.fecha_evento,
      c.lugar,
      c.estado,
      c.fecha_creacion,
      l.libro_id,
      l.titulo AS libro_titulo,
      l.autor AS libro_autor,
      l.portada_url AS libro_portada,
      u.usuario_id AS docente_id,
      u.nombre AS docente_nombre,
      u.avatar_url AS docente_avatar,
      f.foro_id,
      COALESCE(asist.total_asistentes, 0) AS total_asistentes,
      COALESCE(v.votos_positivos, 0) AS votos_positivos,
      COALESCE(v.votos_negativos, 0) AS votos_negativos,
      COALESCE(v.total_votos, 0) AS total_votos,
      mi_asist.estado AS asistencia_usuario,
      mi_voto.voto AS voto_usuario
    FROM cafe_literario c
    LEFT JOIN libro l ON c.libro_id = l.libro_id
    LEFT JOIN usuario u ON c.docente_id = u.usuario_id
    LEFT JOIN foro f ON f.cafe_id = c.cafe_id
    LEFT JOIN (
      SELECT cafe_id, COUNT(*) AS total_asistentes 
      FROM asistencia_cafe 
      WHERE estado = 'confirmado' OR estado = 'asistio'
      GROUP BY cafe_id
    ) asist ON asist.cafe_id = c.cafe_id
    LEFT JOIN (
      SELECT 
        cafe_id,
        COUNT(*) AS total_votos,
        COUNT(*) FILTER (WHERE voto = TRUE) AS votos_positivos,
        COUNT(*) FILTER (WHERE voto = FALSE) AS votos_negativos
      FROM voto_cafe
      GROUP BY cafe_id
    ) v ON v.cafe_id = c.cafe_id
    LEFT JOIN asistencia_cafe mi_asist ON mi_asist.cafe_id = c.cafe_id AND mi_asist.usuario_id = $1
    LEFT JOIN voto_cafe mi_voto ON mi_voto.cafe_id = c.cafe_id AND mi_voto.usuario_id = $1
    ORDER BY c.fecha_evento DESC
  `, [usuario_id]);
};


// Obtener un Café Literario específico por ID con detalles completos
export const obtenerCafePorIdDB = async (cafe_id) => {
  return await db.oneOrNone(`
    SELECT 
      c.cafe_id,
      c.titulo,
      c.descripcion,
      c.fecha_evento,
      c.lugar,
      c.estado,
      c.fecha_creacion,
      l.libro_id,
      l.titulo AS libro_titulo,
      l.autor AS libro_autor,
      l.genero AS libro_genero,
      l.descripcion AS libro_descripcion,
      l.portada_url AS libro_portada,
      u.usuario_id AS docente_id,
      u.nombre AS docente_nombre,
      u.avatar_url AS docente_avatar,
      f.foro_id,
      COALESCE(asist.total_asistentes, 0) AS total_asistentes,
      COALESCE(v.votos_positivos, 0) AS votos_positivos,
      COALESCE(v.votos_negativos, 0) AS votos_negativos,
      COALESCE(v.total_votos, 0) AS total_votos
    FROM cafe_literario c
    LEFT JOIN libro l ON c.libro_id = l.libro_id
    LEFT JOIN usuario u ON c.docente_id = u.usuario_id
    LEFT JOIN foro f ON f.cafe_id = c.cafe_id
    LEFT JOIN (
      SELECT cafe_id, COUNT(*) AS total_asistentes 
      FROM asistencia_cafe 
      WHERE estado = 'confirmado' OR estado = 'asistio'
      GROUP BY cafe_id
    ) asist ON asist.cafe_id = c.cafe_id
    LEFT JOIN (
      SELECT 
        cafe_id,
        COUNT(*) AS total_votos,
        COUNT(*) FILTER (WHERE voto = TRUE) AS votos_positivos,
        COUNT(*) FILTER (WHERE voto = FALSE) AS votos_negativos
      FROM voto_cafe
      GROUP BY cafe_id
    ) v ON v.cafe_id = c.cafe_id
    WHERE c.cafe_id = $1
  `, [cafe_id]);
};

// Actualizar un Café Literario
export const actualizarCafeDB = async (cafe_id, { titulo, descripcion, libro_id, fecha_evento, lugar, estado }) => {
  return await db.oneOrNone(`
    UPDATE cafe_literario
    SET 
      titulo = COALESCE($1, titulo),
      descripcion = COALESCE($2, descripcion),
      libro_id = COALESCE($3, libro_id),
      fecha_evento = COALESCE($4, fecha_evento),
      lugar = COALESCE($5, lugar),
      estado = COALESCE($6, estado)
    WHERE cafe_id = $7
    RETURNING *
  `, [titulo, descripcion, libro_id, fecha_evento, lugar, estado, cafe_id]);
};

// Eliminar un Café Literario
export const eliminarCafeDB = async (cafe_id) => {
  return await db.oneOrNone(`DELETE FROM cafe_literario WHERE cafe_id = $1 RETURNING cafe_id`, [cafe_id]);
};

// ----------------- ASISTENCIA (RSVP) -----------------

// Registrar o cambiar la asistencia de un usuario a un café
export const registrarAsistenciaDB = async (cafe_id, usuario_id, estado = 'confirmado') => {
  return await db.one(`
    INSERT INTO asistencia_cafe (cafe_id, usuario_id, estado)
    VALUES ($1, $2, $3)
    ON CONFLICT (cafe_id, usuario_id) 
    DO UPDATE SET estado = EXCLUDED.estado, fecha_registro = CURRENT_TIMESTAMP
    RETURNING *
  `, [cafe_id, usuario_id, estado]);
};

// Cancelar/Quitar asistencia de un usuario a un café
export const eliminarAsistenciaDB = async (cafe_id, usuario_id) => {
  return await db.oneOrNone(`
    DELETE FROM asistencia_cafe 
    WHERE cafe_id = $1 AND usuario_id = $2
    RETURNING *
  `, [cafe_id, usuario_id]);
};

// Obtener la asistencia específica de un usuario para un café
export const obtenerAsistenciaUsuarioDB = async (cafe_id, usuario_id) => {
  return await db.oneOrNone(`
    SELECT * FROM asistencia_cafe
    WHERE cafe_id = $1 AND usuario_id = $2
  `, [cafe_id, usuario_id]);
};

// Obtener la lista de asistentes a un café
export const obtenerAsistentesCafeDB = async (cafe_id) => {
  return await db.any(`
    SELECT 
      a.asistencia_id,
      a.estado,
      a.fecha_registro,
      u.usuario_id,
      u.nombre,
      u.email,
      u.avatar_url
    FROM asistencia_cafe a
    JOIN usuario u ON a.usuario_id = u.usuario_id
    WHERE a.cafe_id = $1
    ORDER BY a.fecha_registro DESC
  `, [cafe_id]);
};

// ----------------- VOTACIÓN POST-LECTURA -----------------

// Registrar o actualizar el voto del usuario ("¿Te gustó el libro del Café?")
export const registrarVotoDB = async (cafe_id, usuario_id, voto) => {
  return await db.one(`
    INSERT INTO voto_cafe (cafe_id, usuario_id, voto)
    VALUES ($1, $2, $3)
    ON CONFLICT (cafe_id, usuario_id)
    DO UPDATE SET voto = EXCLUDED.voto, fecha_voto = CURRENT_TIMESTAMP
    RETURNING *
  `, [cafe_id, usuario_id, voto]);
};

// Obtener el voto emitido por un usuario para un café específico
export const obtenerVotoUsuarioDB = async (cafe_id, usuario_id) => {
  return await db.oneOrNone(`
    SELECT * FROM voto_cafe
    WHERE cafe_id = $1 AND usuario_id = $2
  `, [cafe_id, usuario_id]);
};
