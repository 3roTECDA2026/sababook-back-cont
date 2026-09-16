-- Insertar roles
INSERT INTO rol (nombre_rol) VALUES ('alumno'), ('docente'), ('administrador');

-- Insertar usuarios con diferentes roles
INSERT INTO usuario (nombre, email, contrasena, rol_id, perfil_completo) VALUES
('Ana García', 'ana.garcia@email.com', '$2b$10$M0/gUqCCa/AKt5HD1CXj8OncNH1d5gBhWIQ8c2rJgf8HwYz2nZCYm', 2, TRUE),
('Juan Pérez', 'juan.perez@email.com', '$2b$10$M0/gUqCCa/AKt5HD1CXj8OncNH1d5gBhWIQ8c2rJgf8HwYz2nZCYm', 1, FALSE),
('Laura Martínez', 'laura.martinez@email.com', '$2b$10$Q9SZH9hI6U0vLVLgagVKFuXsIOieBQpanEEiViuztxmV6N7gm0HqK', 3, TRUE);

-- Insertar libros
INSERT INTO libro (titulo, autor, genero, nivel_educativo) VALUES
('Cien años de soledad', 'Gabriel García Márquez', 'Realismo mágico', 'Secundario'),
('El principito', 'Antoine de Saint-Exupéry', 'Fábula', 'Primario'),
('1984', 'George Orwell', 'Distopía', 'Secundario');

-- Insertar opiniones
INSERT INTO opinion (usuario_id, libro_id, calificacion, comentario) VALUES
(1, 2, 5, 'Un libro esencial para todas las edades.'),
(2, 3, 4, 'Me hizo pensar mucho en la sociedad actual.'),
(1, 1, 5, 'Una lectura obligatoria de la literatura universal.');

-- Más usuarios
INSERT INTO usuario (nombre, email, contrasena, rol_id, perfil_completo, avatar_url) VALUES
('Pedro Gómez', 'pedro.gomez@email.com', '$2b$10$M0/gUqCCa/AKt5HD1CXj8OncNH1d5gBhWIQ8c2rJgf8HwYz2nZCYm', 1, TRUE, 'https://ejemplo.com/avatars/pedro.jpg'),
('Sofía Torres', 'sofia.torres@email.com', '$2b$10$M0/gUqCCa/AKt5HD1CXj8OncNH1d5gBhWIQ8c2rJgf8HwYz2nZCYm', 2, TRUE, 'https://ejemplo.com/avatars/sofia.jpg');


-- Más libros
INSERT INTO libro (titulo, autor, genero, descripcion, portada_url, nivel_educativo) VALUES
('Don Quijote de la Mancha', 'Miguel de Cervantes', 'Novela', 'Una de las obras más destacadas de la literatura española.', 'https://ejemplo.com/portadas/quijote.jpg', 'Universitario'),
('Fahrenheit 451', 'Ray Bradbury', 'Ciencia ficción', 'Una sociedad donde los libros están prohibidos.', 'https://ejemplo.com/portadas/fahrenheit.jpg', 'Secundario');

-- Más opiniones
INSERT INTO opinion (usuario_id, libro_id, calificacion, comentario) VALUES
(2, 4, 3, 'Demasiado largo y complejo para mí.'),
(3, 5, 5, 'Un clásico que te hace reflexionar sobre la libertad de expresión.'),
(4, 5, 4, 'Me encantó la trama, pero me hubiera gustado un final diferente.');

-- Medallas
INSERT INTO medalla (nombre, descripcion, tipo_accion) VALUES
('Lector Compulsivo', 'Por leer 10 libros en un año.', 'lectura'),
('Crítico Literario', 'Por escribir 50 opiniones sobre libros.', 'opinion'),
('Pionero del Foro', 'Por crear el primer foro de debate.', 'foro'),
('Miembro de Club', 'Por unirse a un club de lectura.', 'club');

-- Foros
INSERT INTO foro (titulo, descripcion, creador_id) VALUES
('Debate sobre "1984"', 'Análisis en profundidad de los temas de la novela de Orwell.', 1),
('Recomendaciones de fantasía', 'Comparte tus libros de fantasía favoritos.', 2);

-- Clubes de lectura
INSERT INTO club_lectura (nombre, descripcion, fecha_inicio, fecha_fin, orador) VALUES
('Club de Ciencia Ficción', 'Nos reunimos una vez al mes para debatir un clásico del género.', '2025-10-01', '2026-03-01', 'Prof. Eva Lópe'),
('Aventuras Literarias', 'Para los amantes de las novelas de aventura y viaje.', '2025-11-15', NULL, 'Dr. Marco Polo');

-- Tablas intermedias
INSERT INTO usuario_medalla (usuario_id, medalla_id) VALUES
(1, 1),
(2, 4),
(3, 3),
(4, 2);

INSERT INTO comentario_foro (foro_id, usuario_id, contenido) VALUES
(1, 2, 'Me parece que el Gran Hermano es una metáfora muy relevante hoy en día.'),
(1, 4, 'Estoy de acuerdo. El control del pensamiento es un tema que sigue vigente.'),
(2, 3, 'Recomiendo "El nombre del viento". ¡Es una obra maestra!');

INSERT INTO usuario_club_lectura (usuario_id, club_id, rol_en_club) VALUES
(1, 1, 'miembro'),
(2, 1, 'miembro'),
(3, 2, 'líder');

-- Exportación
INSERT INTO exportacion (usuario_admin_id, cantidad_opiniones_exportadas, formato_archivo, estado) VALUES
(3, 150, 'CSV', 'completado'),
(3, 220, 'XML', 'completado'),
(5, 0, 'JSON', 'error');

