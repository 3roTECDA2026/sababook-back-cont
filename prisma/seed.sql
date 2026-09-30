-- Seed para la base LOCAL de desarrollo (contenedor sababook-postgres).
-- El esquema lo crea `prisma db push`; este archivo solo carga datos.
-- Datos tomados de dump.sql, corregidos y completados con lo que faltaba.
-- Todas las contraseñas son "123456".

TRUNCATE TABLE
  asistencia_cafe, voto_cafe, comentario_foro, foro, cafe_literario,
  usuario_medalla, medalla, usuario_club_lectura, club_lectura,
  favorito, lista_libro, lista_lectura, lista, recurso_educativo,
  opinion, exportacion, libro, usuario, rol,
  actividad_feed, meta_lectura, radio_episodio
RESTART IDENTITY CASCADE;

-- Tabla: rol
INSERT INTO rol (rol_id, nombre_rol) VALUES
  (1, 'alumno'),
  (2, 'docente'),
  (3, 'administrador');

-- Tabla: usuario
INSERT INTO usuario (usuario_id, nombre, email, contrasena, rol_id, fecha_registro, perfil_completo, avatar_url, nivel_educativo) VALUES
  (1, 'Ana García',      'ana.garcia@email.com',      '$2b$10$BXEjZBmCxfNN4lCaY.A/eOfhagqFtZjbSCpE2vkn3GeOVzcOENrmS', 2, '2026-08-27T22:20:19.605Z', true,  NULL, 'Secundario'),
  (2, 'Juan Pérez',      'juan.perez@email.com',      '$2b$10$BXEjZBmCxfNN4lCaY.A/eOfhagqFtZjbSCpE2vkn3GeOVzcOENrmS', 1, '2026-08-27T22:20:19.605Z', false, NULL, NULL),
  (3, 'Laura Martínez',  'laura.martinez@email.com',  '$2b$10$BXEjZBmCxfNN4lCaY.A/eOfhagqFtZjbSCpE2vkn3GeOVzcOENrmS', 3, '2026-08-27T22:20:19.605Z', true,  NULL, 'Universitario'),
  (4, 'Pedro Gómez',     'pedro.gomez@email.com',     '$2b$10$BXEjZBmCxfNN4lCaY.A/eOfhagqFtZjbSCpE2vkn3GeOVzcOENrmS', 1, '2026-08-27T22:20:19.605Z', true,  'https://ejemplo.com/avatars/pedro.jpg', 'Primario'),
  (5, 'Sofía Torres',    'sofia.torres@email.com',    '$2b$10$BXEjZBmCxfNN4lCaY.A/eOfhagqFtZjbSCpE2vkn3GeOVzcOENrmS', 2, '2026-08-27T22:20:19.605Z', true,  'https://ejemplo.com/avatars/sofia.jpg', 'Secundario');

-- Tabla: libro
INSERT INTO libro (libro_id, titulo, autor, genero, descripcion, portada_url, nivel_educativo, calificacion_promedio, activo) VALUES
  (1, 'Cien años de soledad',  'Gabriel García Márquez',  'Realismo mágico',  'La saga de los Buendía a lo largo de siete generaciones.',                       NULL,                                            'Secundario',  4.8, true),
  (2, 'El principito',        'Antoine de Saint-Exupéry', 'Fábula',           'Un aviador stranded en el desierto conoce a un niño de otro planeta.',                 NULL,                                            'Primario',    4.9, true),
  (3, '1984',                 'George Orwell',            'Distopía',        'Una sociedad donde todo es vigilado y la verdad está prohibida.',                     NULL,                                            'Secundario',  4.7, true),
  (4, 'Don Quijote de la Mancha', 'Miguel de Cervantes',   'Novela',          'Una de las obras más destacadas de la literatura española.',                        'https://ejemplo.com/portadas/quijote.jpg',    'Universitario', 4.6, true),
  (5, 'Fahrenheit 451',        'Ray Bradbury',             'Ciencia ficción', 'Una sociedad donde los libros están prohibidos.',                                    'https://ejemplo.com/portadas/fahrenheit.jpg', 'Secundario',  4.5, true);

-- Tabla: recurso_educativo
INSERT INTO recurso_educativo (recurso_id, libro_id, tipo, url, descripcion) VALUES
  (1, 1, 'video',  'https://ejemplo.com/videos/cien-anos-soledad',   'Charla introductoria sobre realismo mágico.'),
  (2, 2, 'audio',  'https://ejemplo.com/audio/el-principito',        'Lectura dramatizada completa.'),
  (3, 3, 'enlace', 'https://ejemplo.com/recursos/1984-contexto',    'Contexto histórico de la novela.'),
  (4, 5, 'imagen', 'https://ejemplo.com/imagenes/fahrenheit-cartel', 'Carteles de la novela en el contexto del libro.');

-- Tabla: lista
INSERT INTO lista (lista_id, nombre, descripcion, tipo, fecha_creacion) VALUES
  (1, 'Lecturas para Secundario',   'Textos obligatorios del curriculum de secondaire.',        'tematica',      '2026-08-27T22:20:19.605Z'),
  (2, 'Recomendaciones del docente','Libros que sugiere el Prof. Salvatori.',                     'recomendacion', '2026-08-27T22:20:19.605Z');

-- Tabla: lista_lectura (listas creadas por un docente)
INSERT INTO lista_lectura (lista_id, docente_id, descripcion, nivel, fecha_creacion) VALUES
  (1, 1, 'Primera quincena del cuatrimestre.', 'Secundario', '2026-08-27T22:20:19.605Z'),
  (2, 5, 'Sugerencias para leer en vacaciones.', NULL,        '2026-08-27T22:20:19.605Z');

-- Tabla: lista_libro
INSERT INTO lista_libro (lista_id, libro_id) VALUES
  (1, 1), (1, 3), (1, 5),
  (2, 2), (2, 4);

-- Tabla: opinion
INSERT INTO opinion (opinion_id, usuario_id, libro_id, calificacion, comentario, fecha) VALUES
  (1, 1, 2, 5, 'Un libro esencial para todas las edades.',                                   '2026-08-27T22:20:19.605Z'),
  (2, 2, 3, 4, 'Me hizo pensar mucho en la sociedad actual.',                               '2026-08-27T22:20:19.605Z'),
  (3, 1, 1, 5, 'Una lectura obligatoria de la literatura universal.',                        '2026-08-27T22:20:19.605Z'),
  (4, 2, 4, 3, 'Demasiado largo y complejo para mí.',                                       '2026-08-27T22:20:19.605Z'),
  (5, 3, 5, 5, 'Un clásico que te hace reflexionar sobre la libertad de expresión.',        '2026-08-27T22:20:19.605Z'),
  (6, 4, 5, 4, 'Me encantó la trama, pero me hubiera gustado un final diferente.',          '2026-08-27T22:20:19.605Z');

-- Tabla: favorito
INSERT INTO favorito (usuario_id, libro_id, estado_lectura) VALUES
  (1, 1, 'leyendo'),
  (1, 5, 'quiero-leer'),
  (2, 2, 'leido'),
  (3, 3, 'general');

-- Tabla: cafe_literario
INSERT INTO cafe_literario (cafe_id, titulo, descripcion, libro_id, docente_id, fecha_evento, lugar, estado, fecha_creacion) VALUES
  (1, 'Café Literario: Ray Bradbury',  'Charla y merienda comentando Fahrenheit 451.',      5, 1, '2026-09-10T17:00:00.000Z', 'Biblioteca Ernesto Sábato', 'programado',  '2026-08-27T22:20:19.605Z'),
  (2, 'Café Literario: Orwell',         'Debate sobre el control y la libertad individual.',   3, 5, '2026-09-24T17:00:00.000Z', 'Biblioteca Ernesto Sábato', 'programado',  '2026-08-27T22:20:19.605Z'),
  (3, 'Café Literario: García Márquez', 'Encuentro de autores con la comunidad.',  1, 1, '2026-08-05T17:00:00.000Z', 'Aula 12',                  'finalizado', '2026-08-27T22:20:19.605Z');

-- Tabla: asistencia_cafe
INSERT INTO asistencia_cafe (asistencia_id, cafe_id, usuario_id, estado, fecha_registro) VALUES
  (1, 1, 2, 'confirmado', '2026-08-27T22:20:19.605Z'),
  (2, 1, 4, 'confirmado', '2026-08-27T22:20:19.605Z'),
  (3, 2, 2, 'confirmado', '2026-08-27T22:20:19.605Z'),
  (4, 3, 1, 'asistio',    '2026-08-27T22:20:19.605Z'),
  (5, 3, 3, 'asistio',    '2026-08-27T22:20:19.605Z');

-- Tabla: voto_cafe
INSERT INTO voto_cafe (voto_id, cafe_id, usuario_id, voto, fecha_voto) VALUES
  (1, 1, 2, true,  '2026-08-27T22:20:19.605Z'),
  (2, 1, 4, false, '2026-08-27T22:20:19.605Z'),
  (3, 3, 1, true,  '2026-08-27T22:20:19.605Z'),
  (4, 3, 3, true,  '2026-08-27T22:20:19.605Z');

-- Tabla: radio_episodio
INSERT INTO radio_episodio (episodio_id, titulo, descripcion, audio_url, programa, fecha_emision) VALUES
  (1, 'Radio Sábato ep. 12 — La lectura en voz alta', 'Conversación con estudiantes sobre la importancia de leer en público.', 'https://ejemplo.com/audio/radio-sabato/ep12.mp3', 'Radio Sábato', '2026-09-02T15:00:00.000Z'),
  (2, 'Radio Sábato ep. 13 — Conversación con Ana García', 'La docente comenta qué se está leyendo este cuatrimestre.', 'https://ejemplo.com/audio/radio-sabato/ep13.mp3', 'Radio Sábato', '2026-09-09T15:00:00.000Z');

-- Tabla: foro
INSERT INTO foro (foro_id, titulo, descripcion, creador_id, cafe_id, episodio_id, es_apl, fecha_creacion) VALUES
  (1, 'Debate sobre "1984"',           'Análisis en profundidad de los temas de la novela de Orwell.',       1, NULL, NULL,   false, '2026-08-27T22:20:19.605Z'),
  (2, 'Recomendaciones de fantasía',   'Comparte tus libros de fantasía favoritos.',                        2, NULL, NULL,   false, '2026-08-27T22:20:19.605Z'),
  (3, 'Conversación previa al café',   'Hilo del encuentro sobre Fahrenheit 451.',                         1, 1,    NULL,   false, '2026-08-27T22:20:19.605Z'),
  (4, 'Debate en el aula: Fahrenheit 451', 'Foro de apoyo para el eje de la unidad de lectura.',                 5, NULL, 1,      true,  '2026-08-27T22:20:19.605Z');

-- Tabla: comentario_foro
INSERT INTO comentario_foro (comentario_id, foro_id, usuario_id, contenido, fecha) VALUES
  (1, 1, 2, 'Me parece que el Gran Hermano es una metáfora muy relevante hoy en día.',                  '2026-08-27T22:20:19.605Z'),
  (2, 1, 4, 'Estoy de acuerdo. El control del pensamiento es un tema que sigue vigente.',              '2026-08-27T22:20:19.605Z'),
  (3, 2, 3, 'Recomiendo "El nombre de la rosa". ¡Es una obra maestra!',                               '2026-08-27T22:20:19.605Z'),
  (4, 3, 2, '¿Van a leer fragmentos en clase o lo trabajamos por partes?',                          '2026-08-27T22:20:19.605Z');

-- Tabla: club_lectura
INSERT INTO club_lectura (club_id, nombre, descripcion, fecha_inicio, fecha_fin, orador) VALUES
  (1, 'Club de Ciencia Ficción', 'Nos reunimos una vez al mes para debatir un clásico del género.', '2025-10-01', '2026-03-01', 'Prof. Eva Lópe'),
  (2, 'Aventuras Literarias',    'Para los amantes de las novelas de aventura y viaje.',              '2025-11-15', NULL,          'Dr. Marco Polo');

-- Tabla: usuario_club_lectura
INSERT INTO usuario_club_lectura (usuario_id, club_id, fecha_ingreso, rol_en_club) VALUES
  (1, 1, '2026-08-27T22:20:19.605Z', 'miembro'),
  (2, 1, '2026-08-27T22:20:19.605Z', 'miembro'),
  (3, 2, '2026-08-27T22:20:19.605Z', 'líder');

-- Tabla: medalla
INSERT INTO medalla (medalla_id, nombre, descripcion, tipo_accion, fecha_creacion) VALUES
  (1, 'Lector Compulsivo', 'Por leer 10 libros en un año.',                       'lectura', '2026-08-27T22:20:19.605Z'),
  (2, 'Crítico Literario', 'Por escribir 50 opiniones sobre libros.',             'opinion', '2026-08-27T22:20:19.605Z'),
  (3, 'Pionero del Foro',  'Por crear el primer foro de debate.',                 'foro',    '2026-08-27T22:20:19.605Z'),
  (4, 'Miembro de Club',   'Por unirse a un club de lectura.',                     'club',    '2026-08-27T22:20:19.605Z');

-- Tabla: usuario_medalla
INSERT INTO usuario_medalla (usuario_id, medalla_id, fecha_obtenida) VALUES
  (1, 1, '2026-08-27T22:20:19.605Z'),
  (2, 4, '2026-08-27T22:20:19.605Z'),
  (3, 3, '2026-08-27T22:20:19.605Z'),
  (4, 2, '2026-08-27T22:20:19.605Z');

-- Tabla: exportacion
INSERT INTO exportacion (exportacion_id, fecha_exportacion, usuario_admin_id, cantidad_opiniones_exportadas, formato_archivo, estado) VALUES
  (1, '2026-08-27T22:20:19.605Z', 3, 150, 'CSV',  'completado'),
  (2, '2026-08-27T22:20:19.605Z', 3, 220, 'XML',  'completado'),
  (3, '2026-08-27T22:20:19.605Z', 5, 0,   'JSON', 'error');

-- Tabla: meta_lectura
INSERT INTO meta_lectura (meta_id, usuario_id, periodo_nombre, cantidad_libros, fecha_inicio, fecha_fin, fecha_creacion) VALUES
  (1, 2, '1º Cuatrimestre 2026', 4, '2026-08-01', '2026-11-30', '2026-08-27T22:20:19.605Z'),
  (2, 2, 'Meta Anual 2026',       12, '2026-01-01', '2026-12-31', '2026-08-27T22:20:19.605Z'),
  (3, 4, '1º Cuatrimestre 2026', 3, '2026-08-01', '2026-11-30', '2026-08-27T22:20:19.605Z');

-- Tabla: actividad_feed
INSERT INTO actividad_feed (actividad_id, usuario_id, tipo, titulo, descripcion, entidad_id, fecha) VALUES
  (1, 1, 'NUEVO_LIBRO',    'Nuevo libro en el catálogo',                  'Se agregó "Fahrenheit 451" de Ray Bradbury.',            5, '2026-08-27T22:20:19.605Z'),
  (2, 1, 'RADIO_EPISODIO', 'Nuevo episodio de Radio Sábato',              'Radio Sábato ep. 12 — La lectura en voz alta.',          1, '2026-08-27T22:20:19.605Z'),
  (3, 5, 'FORO_APL',       'Nuevo foro de actividad',                    'Debate en el aula: Fahrenheit 451',                      4, '2026-08-27T22:20:19.605Z'),
  (4, 2, 'NUEVA_OPINION',  'Nueva opinión sobre un libro',                'Juan Pérez opina sobre "1984".',                          3, '2026-08-27T22:20:19.605Z'),
  (5, 3, 'AVISO',          'Cierre de inscripciones',                      'Este fin de semana no hay actividades en la biblioteca.',  NULL, '2026-08-27T22:20:19.605Z');

-- -------------------------------------------------------------
-- El seed inserta los IDs a mano, así que las secuencias quedan
-- atrás y el próximo INSERT automático choca con un duplicado.
-- Las dejamos arriba del último ID usado en cada tabla.
-- -------------------------------------------------------------
DO $$
DECLARE
  col RECORD;
BEGIN
  FOR col IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_default LIKE 'nextval%'
      AND table_name <> '_prisma_migrations'
  LOOP
    EXECUTE format(
      'SELECT setval(pg_get_serial_sequence(%L, %L), GREATEST(COALESCE((SELECT MAX(%I) FROM %I), 1), 1))',
      col.table_name, col.column_name, col.column_name, col.table_name
    );
  END LOOP;
END $$;
