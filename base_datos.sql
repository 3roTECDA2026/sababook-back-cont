DROP TABLE IF EXISTS comentario_foro, exportacion, favorito, foro, lista_lectura, lista_libro, opinion, recurso_educativo, usuario_club_lectura, usuario_medalla, usuario, "Usuario", rol, libro, "Libro", medalla, lista, club_lectura CASCADE;-- =========================================
-- 1. CREACIÓN DE TABLAS
-- =========================================

CREATE TABLE rol (
    rol_id SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE usuario (
    usuario_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    contrasena TEXT NOT NULL,
    rol_id INTEGER REFERENCES rol(rol_id),
    fecha_registro TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    perfil_completo BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    nivel_educativo VARCHAR(50)
);

CREATE TABLE libro (
    libro_id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(255) NOT NULL,
    genero VARCHAR(100),
    descripcion TEXT,
    portada_url TEXT,
    nivel_educativo VARCHAR(50),
    calificacion_promedio FLOAT
);

CREATE TABLE lista (
    lista_id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50), 
    fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lista_lectura (
    lista_id INTEGER REFERENCES lista(lista_id) ON DELETE CASCADE,
    docente_id INTEGER REFERENCES usuario(usuario_id),
    descripcion TEXT,
    nivel VARCHAR(50),
    fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (lista_id, docente_id)
);

CREATE TABLE lista_libro (
    lista_id INTEGER REFERENCES lista(lista_id) ON DELETE CASCADE,
    libro_id INTEGER REFERENCES libro(libro_id) ON DELETE CASCADE,
    PRIMARY KEY (lista_id, libro_id)
);

CREATE TABLE recurso_educativo (
    recurso_id SERIAL PRIMARY KEY,
    libro_id INTEGER REFERENCES libro(libro_id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, 
    url TEXT NOT NULL,
    descripcion TEXT
);

CREATE TABLE opinion (
    opinion_id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuario(usuario_id),
    libro_id INTEGER REFERENCES libro(libro_id) ON DELETE CASCADE,
    calificacion SMALLINT CHECK (calificacion >= 1 AND calificacion <= 5),
    comentario TEXT,
    fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE foro (
    foro_id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    creador_id INTEGER REFERENCES usuario(usuario_id),
    fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comentario_foro (
    comentario_id SERIAL PRIMARY KEY,
    foro_id INTEGER REFERENCES foro(foro_id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuario(usuario_id),
    contenido TEXT NOT NULL,
    fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE club_lectura (
    club_id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE,
    fecha_fin DATE,
    orador VARCHAR(255)
);

CREATE TABLE usuario_club_lectura (
    usuario_id INTEGER REFERENCES usuario(usuario_id),
    club_id INTEGER REFERENCES club_lectura(club_id),
    fecha_ingreso TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    rol_en_club VARCHAR(50),
    PRIMARY KEY (usuario_id, club_id)
);

CREATE TABLE medalla (
    medalla_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    tipo_accion VARCHAR(50), 
    fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuario_medalla (
    usuario_id INTEGER REFERENCES usuario(usuario_id),
    medalla_id INTEGER REFERENCES medalla(medalla_id),
    fecha_obtenida TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, medalla_id)
);

CREATE TABLE exportacion (
    exportacion_id SERIAL PRIMARY KEY,
    fecha_exportacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    usuario_admin_id INTEGER REFERENCES usuario(usuario_id),
    cantidad_opiniones_exportadas INTEGER,
    formato_archivo VARCHAR(50),
    estado VARCHAR(50)
);

CREATE TABLE favorito (
    usuario_id INTEGER NOT NULL,
    libro_id INTEGER NOT NULL,
    CONSTRAINT fk_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (usuario_id) ON DELETE CASCADE,
    CONSTRAINT fk_libro FOREIGN KEY (libro_id) REFERENCES libro (libro_id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, libro_id)
);


-- =========================================
-- 2. INSERCIÓN DE DATOS (Ordenados por dependencia)
-- =========================================

INSERT INTO rol (rol_id, nombre_rol) VALUES
(1, 'alumno'),
(2, 'docente'),
(3, 'administrador');

-- Insertamos todos los libros juntos usando explícitamente la tabla en minúsculas `libro`
INSERT INTO libro (libro_id, titulo, autor, genero, descripcion, portada_url, nivel_educativo, calificacion_promedio) VALUES
(1, 'Cien años de soledad', 'Gabriel García Márquez', 'Realismo mágico', NULL, NULL, 'Secundario', NULL),
(2, 'El principito', 'Antoine de Saint-Exupéry', 'Fábula', NULL, NULL, 'Primario', NULL),
(3, '1984', 'George Orwell', 'Distopía', NULL, NULL, 'Secundario', NULL),
(4, 'Cien años de soledad', 'Gabriel García Márquez', 'Novela', NULL, 'https://www.rae.es/sites/default/files/portada_cien_anos_de_soledad_0.jpg', 'Superior', 3),
(5, 'El principito', 'Antoine de Saint-Exupéry', 'Fábula', 'Cuenta la historia de un piloto varado en el desierto que encuentra a un niño, el Principito, proveniente de otro asteroide.', 'https://cdn.prod.website-files.com/6034d7d1f3e0f52c50b2adee/681b63dd7d9dbb4c4ce5ae76_WJlUnXLgNrZqh3HN_u7WMEnTVs1tV0qKwtUkvXJ2JTk.jpeg', 'Básico', 4),
(6, '1984', 'George Orwell', 'Ficción', 'es un libro', 'https://acdnus.mitiendanube.com/stores/004/088/117/products/569813-cedaf5cd715a2c721d17273678784297-1024-1024.jpg', 'Básico', 3),
(9, 'La gran ocasión', 'Montes Graciela', 'Novela', 'La especialista y escritora argentina Graciela Montes reflexiona acerca de la lectura.', 'https://buenosaires.gob.ar/sites/default/files/media/image/2021/03/27/91e6ed445a86ed17dbcce18f8e317d3e5ea41e11.jpg', 'Básico', 5),
(10, 'Los ojos del perro Siberiano', 'Antonio Santa Ana', 'Novela', 'Es la Historia de un adolescente que descubre que su hermano padece VIH', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3t0F5xVwGmA6J3m_O0byamLPvZSEoKUEVg&s', 'Básico', 4),
(12, 'Don Quijote de la Mancha', 'Miguel de Cervantes Saavedra', 'Novela', 'Considerada una de las obras más importantes de la literatura universal.', 'https://www.planetadelibros.cl/usuaris/libros/thumbs/c71e8c1a-f520-4bb3-9feea592585ba8b0/d_1200_1200/379580_portada_don-quijote-de-la-mancha-comic_miguelde-cervantes_202310231106.webp', 'Superior', 4),
(13, 'Rebelion en la granja', 'George Orwell', 'Novela', 'Orientado a estudiantes de sexto año.', 'https://colegiolospensamientos.cl/wp-content/uploads/2024/04/Mayo-IV%C2%B0M.-La-rebelion-en-la-granja-George-Orwell-200x300.jpg', 'Superior', NULL),
(14, 'Martín Fierro', 'José Hernández', 'Poesía', 'Poema épico nacional argentino.', 'https://www.argentina.gob.ar/sites/default/files/martin-fierro-34534sf-8.jpg', 'Superior', 5),
(15, 'Rayuela', 'Julio Cortázar', 'Novela', 'Obra fundamental del boom latinoamericano.', 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Rayuela_JC.png', 'Superior', 4),
(16, 'La casa de los espíritus', 'Isabel Allende', 'Realismo mágico', 'Sigue a la familia Trueba a lo largo de generaciones.', 'https://images.cdn2.buscalibre.com/fit-in/360x360/f6/48/f648c86c1bd999355234c41ff527954e.jpg', 'Superior', 4),
(17, 'Rosaura a las diez', 'Marco Denevi', 'Policial', 'Novela policial psicológica argentina.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSW24ZQV2N-jHaP041EelwjGJF3iox5_HpaRQ&s', 'Superior', 4),
(18, 'Crónica de una muerte anunciada', 'Gabriel García Márquez', 'Novela', 'Narra el asesinato de Santiago Nasar.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBB864HsyzicB97xFq5mb1FSzaRiatzGNe_g&s', 'Superior', 5),
(19, 'Antígona Vélez', 'Leopoldo Marechal', 'Teatro', 'Versión argentina de la tragedia de Sófocles.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSaWbHTxv1w4MZrJapU3FTZLt6KYDcazIi02A&s', 'Superior', 4),
(20, 'El túnel', 'Ernesto Sabato', 'Novela psicológica', 'Cuenta la historia de un pintor obsesionado con una mujer.', 'https://palabrasylogos.odiseus.org/files/2013/06/EL-TUNEL-PORTADA.jpg', 'Superior', 5),
(21, 'Juvenilia', 'Miguel Cané', 'Memorias', 'Recoge recuerdos de juventud del autor.', 'https://colihue.com.ar/wp-content/uploads/2022/11/COLCI-101037-69789505810376.jpg', 'Superior', 3);

INSERT INTO usuario (usuario_id, nombre, email, contrasena, rol_id, fecha_registro, perfil_completo, avatar_url, nivel_educativo) VALUES
(11, 'Admin', 'admin@sababook.com', '$2b$10$7JJs8/7IgewIcsVkb9Q4N.h.IJ0qgnL0W0TvMjcf.wjgLDiZxRD9a', 3, '2025-10-11 20:02:09.429+00', true, NULL, 'Postgrado'),
(14, 'nico', 'nico@sababook.com', '$2b$10$TFaEA.mKa4QFxNFk0uiiLe3sjf74792OLfMRg32Jd8KIRZzOcK4Sa', 1, '2025-10-18 15:01:21.242+00', false, 'https://w7.pngwing.com/pngs/551/1015/png-transparentmagician-avatar-character-wizard-house-purple-hat-violet.png', 'Básico'),
(15, 'superAdmin', 'superadmin@sababook.com', '$2b$10$XZdybwpzmeLoKSpJFTrPf.cqAU/x.ncV6t7tpHrPpJr/hCdpcM00G', 3, '2025-10-18 15:03:56.659+00', false, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3LJEvl8LlkqsUNZj4APMG28PMvqDbqqB-BA&s', 'Superior'),
(16, 'juan', 'juan@sababook.com', '$2b$10$/CYPY3ynQfz5.IuHQbfyHuJWQ3X5TXsBJHv9wwXis4iD437WqSKl2', 1, '2025-10-18 16:19:42.077+00', false, 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ryker', 'Básico'),
(17, 'Nico', 'admin10@sababook.com', '$2b$10$UeCnLqMWCce2ZBTWPmVsV.DuvoCthvTZdE.J6YbjHRLFCpt7io2Dq', 3, '2025-10-18 20:56:17.224+00', false, 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/GANDALF.jpg/960pxGANDALF.jpg', 'Superior'),
(18, 'Silvana', 'silvana@test.com', '$2b$10$apdJ.4GM92SbiAL4xKVbMeMh426PsDKufaGzh2gG1/XPxK6yl.WV2', 2, '2025-10-19 01:00:48.596+00', false, NULL, NULL),
(19, 'Admin', 'admin@test.com', '$2b$10$iP6poh9DGH/59d0lMluD1eokQgSdPMSZGOUXO3q2nsMTvV3Q/Mbga', 3, '2025-10-19 22:20:15.572+00', false, NULL, NULL),
(20, 'Adminsil', 'admin@email.com', '$2b$10$Y569qtkSL3trqxVvT6Q6vuLmOv./IfL86ZUkY4A9rQzJSlTAL6gB2', 3, '2025-10-24 14:00:55.465+00', false, 'https://static.vecteezy.com/system/resources/previews/025/869/645/non_2x/profile-image-of-woman-avatar-for-social-networks-with-half-circle-fashionbright-illustration-in-trendy-style-free-vector.jpg', ''),
(21, 'Dominique', 'dominique@mailsabato.com', '$2b$10$k69TKOMseCv74ltG7M0tGuRTGDsjdB4LL3mW6hZt6r5m.fLobx3/q', 3, '2025-10-29 21:58:47.23+00', false, 'https://thumbs.dreamstime.com/b/libros-de-lecturatiras-dibujos-animados-para-bibliotecarios-j%C3%B3venes-una-joven-bibliotecarialeyendo-con-alegr%C3%ADas-354449046.jpg', 'Superior'),
(22, 'María Florencia', 'florencia@sabato.edu.ar', '$2b$10$0Yz.8vbZmZJ118xOr4SfXeJSw0ygBeIASuW24YIgBT8V9Rn/N6Sd.', 2, '2025-10-29 22:00:54.96+00', false, 'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo', 'Superior'),
(24, 'Ana Maria', 'ana@maria.com', '$2b$10$Ej02tKyJq.xPscpwuBiEpOUez/LrPtBV4SmYv4gloG3Jjg0vqTlSq', 3, '2025-10-29 22:31:45.172+00', false, '', ''),
(25, 'Juan Cruz', 'usuario@email.com', '$2b$10$aoIiORSrmmEZzs1Af3SjfuL/lZlnoQbrcAz2gwWg08sQE9XEdNjhe', 1, '2025-10-30 21:39:32.299+00', false, '', 'Básico'),
(26, 'nico', 'alumno@alumno.com', '$2b$10$9rzzChRUEeDY8T3/uY01Z.0A.5RCc27scumR8TpP.8aOnvPtAKIga', 1, '2025-10-30 23:09:26.483+00', false, '', 'Básico'),
(27, 'Laura administradora', 'lauadministradora@sababook.com', '$2b$10$jZuzFi3VkpeSK/E2BaSRx.ChN/YzPWiMT32hlcGbSGx9xM4dJB/1u', 3, '2025-10-31 17:10:59.205+00', false, 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe', 'Superior'),
(28, 'lau alumna', 'laualumno@sababook.com.ar', '$2b$10$o8B7dwYWYqM6k1LffrQCg.zk7xvoQmeEVXPUCfRu9xm0.IkhneA2G', 1, '2025-10-31 17:12:41.131+00', false, 'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo', 'Media'),
(29, 'cristian pablo', 'cristian@email.com', '$2b$10$qDviZ.4/uKlAU0NIifcDCuyl19aTso29iSynNFlL5LOcvYm/FQGfq', 2, '2025-10-31 23:22:51.944+00', false, '', ''),
(30, 'siladmin1', 'siladmin@email.com', '$2b$10$.F7z3rO3z7vbSnfN7TbW.e6q1hSk8gXhjEW4q6oFS9I1muXIeOXty', 3, '2025-11-05 15:51:53.429+00', false, 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe', ''),
(31, 'silalumno', 'sil@email.com', '$2b$10$CqAhFwnaC.No2vEZkdqFmubdy8BRxiR.MpF8qoN.BkjGUNmIjm/IC', 1, '2025-11-11 22:47:31.004+00', false, NULL, NULL),
(32, 'Federico', 'fede@sabato.com', '$2b$10$meFpdHpxeViBIR5qkRoSCuzc30q/bMrNVi3Rh8BsYV/6cb/aaUvGm', 1, '2025-11-12 22:51:04.721+00', false, 'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo', 'Básico'),
(34, 'silvana2', 'silvana2@test.com', '$2b$10$J0cy9KfiFh2WZ58zHPV33.p2Ves05Z7fCEZpSpxJEx1gVnzUWE5Pa', 1, '2025-11-18 19:55:16.26+00', false, 'https://static.vecteezy.com/system/resources/previews/025/869/645/non_2x/profile-image-of-woman-avatar-for-social-networks-with-half-circle-fashionbright-illustration-in-trendy-style-free-vector.jpg', 'Básico'),
(36, 'silvanadocente', 'silvanadocente@test.com', '$2b$10$cp3ooDpvFPEFR9vK6dr/Ieg/jDz9C1/.T4xUtXjqLfpUerfmlxQUi', 2, '2025-11-18 20:02:22.679+00', false, 'https://images.icon-icons.com/2859/PNG/512/avatar_face_girl_female_woman_profile_smiley_happy_people_icon_181665.png', 'Media'),
(37, 'Docente Test', 'docente@test.com', '$2b$10$c.kQwHdM9WmevFmprn6mb.pQtnZsEaBnn3qwdrfpmUERW67LOG5i.', 2, '2025-11-18 22:49:35.236+00', false, NULL, NULL),
(38, 'Lucia', 'lucia.docente@sababook.com', '$2b$10$G1bFN9t9enEirlyF3QdR2OC5Mm21HayPi8OKcMzXP68n4gElFw8QG', 3, '2025-11-18 22:59:32.061+00', false, 'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo', NULL),
(39, 'Lucia', 'lucia.alumno@sababook.com', '$2b$10$G.QolZsuVgLIrfXNml7tAeK0Xid1Ky24YSPX7PTf0AqQ9E7XM5Wkq', 1, '2025-11-18 22:59:38.79+00', false, 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kimberly', NULL),
(40, 'Paula', 'paula@sabato.com', '$2b$10$gKJbwt9pvWl/O7i7YJQbNe4ZFwT0LrQMXyKzZnCjMBtFubbpZeytS', 1, '2025-11-19 17:34:56.103+00', false, '', 'Media'),
(42, 'Gregorio Samsa', 'gregosamsa@gmail.com', '1234', 1, '2026-05-27 22:04:12.271+00', false, 'https://api.dicebear.com/7.x/adventurer/svg?seed=Max', 'Superior'),
(43, 'Merlina', 'merlina23@gmail.com', '$2b$10$6CcPiAaVzyk/kdSQQY4i4.vXdDl9iUsSXD6AITctIALwdn1uwBecq', 1, '2026-05-27 22:10:23.812+00', false, 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kimberly', 'Superior'),
(44, 'Aureliano ', 'aurebuendia@gmail.com', '$2b$10$jrSHpYGpO/m.8ZbJfnlTCuQobeBbA9NqG.Hs7I.QUmABD6hP3/XFK', 1, '2026-07-03 21:15:53.98+00', false, '', 'Superior'),
(45, 'Dana', 'danapinna@gmail.com', '$2b$10$9fqq7OJrMDME9.EUDpiW0OanIGpMF80wz/mgM.6eZwVf2Oxd3DHV2', 2, '2026-07-12 18:59:28.671+00', false, '', 'Superior');

INSERT INTO lista (lista_id, nombre, descripcion, tipo, fecha_creacion) VALUES
(2, 'Lista de libros para actividad 2', 'Libros que recomiendo para actividad 2', 'recomendacion', '2025-10-07 02:36:50.087542+00'),
(3, 'Lista de libros para matematica', 'Libros que recomiendo para matematica', 'practica', '2025-10-07 02:40:46.100361+00'),
(4, 'Lecturas de Historia Moderna', 'Libros sobre historia mundial moderna', 'tematica', '2025-10-07 02:41:47.429539+00');

INSERT INTO lista_lectura (lista_id, docente_id, descripcion, nivel, fecha_creacion) VALUES
(3, 17, 'Lista de lectura para el primer trimestre', 'Primario', '2025-10-07 03:31:35.324224+00'),
(4, 21, 'Lecturas recomendadas para el segundo trimestre', 'Secundario', '2025-10-07 03:36:55.616411+00'),
(4, 22, 'Material para alumnos de secundaria', 'secundario', '2025-10-07 03:13:37.791547+00'),
(3, 22, 'Material para alumnos de secundaria', 'Secundario', '2025-10-07 03:11:14.408375+00'),
(2, 21, 'Lista actualizada con textos nuevos', 'Secundario Avanzado', '2025-10-07 03:09:26.478252+00');

INSERT INTO foro (foro_id, titulo, descripcion, creador_id, fecha_creacion) VALUES
(19, 'Literatura ciencia ficcion', 'ciencia ficción', 17, '2025-10-29 22:32:58.290719+00'),
(23, 'Literatura romántica', 'Como agua para chocolate', 24, '2025-10-29 22:53:45.703239+00'),
(32, 'Poemas romanticos ingleses', 'Historia de la Literatura.', 17, '2025-11-18 02:07:49.522928+00'),
(37, 'Hablemos de tus libros favoritos', 'Espacio para la motivación a la lectura en adolescentes.', 38, '2025-11-18 23:18:29.977306+00'),
(5, 'Foro de programación', 'Hablemos de JavaScript, Node y más', 21, '2025-10-21 03:45:51.78682+00'),
(38, 'Foro nuevo', 'Foro nuevo', 17, '2026-07-03 00:07:35.355171+00'),
(39, 'zxcvsfafafasd', 'asdfasf', 17, '2026-07-03 00:08:25.685284+00'),
(40, 'Holiii', 'Fhbd', 17, '2026-07-03 00:08:44.603259+00'),
(41, 'Nuevos lectores', ',', 17, '2026-08-03 18:51:33.424562+00');

INSERT INTO comentario_foro (comentario_id, foro_id, usuario_id, contenido, fecha) VALUES
(21, 5, 22, 'mi comentario', '2025-11-15 03:08:19.602629+00'),
(23, 5, 22, 'actualizando', '2025-11-15 03:19:31.690784+00'),
(24, 5, 14, 'caasasa', '2025-11-15 03:23:00.077121+00'),
(22, 5, 16, 'otro comentario', '2025-11-15 03:18:31.16006+00'),
(25, 23, 22, 'otro comnetario', '2025-11-15 03:27:20.578892+00'),
(27, 23, 25, E'ajam\n', '2025-11-15 15:49:31.455085+00'),
(34, 32, 28, 'me parecio muy interesante', '2025-11-18 19:21:56.891894+00'),
(35, 5, 34, 'espectacular el foro', '2025-11-18 19:59:04.844529+00'),
(43, 32, 39, 'Wordsworth tiene muchos trabajos impresionantes, digno de leer!', '2025-11-18 23:36:09.387443+00'),
(44, 37, 32, 'Mi preferido fue la gran ocasion', '2025-11-19 01:48:33.772221+00'),
(47, 5, 29, 'probando foro', '2025-11-20 21:01:54.264777+00'),
(48, 23, 29, 'ja', '2025-11-21 00:17:50.511995+00'),
(49, 19, 29, 'hola', '2025-11-21 01:36:37.53993+00'),
(50, 5, 42, 'merlina se olvido la contrasena', '2026-05-27 22:07:51.544698+00'),
(51, 5, 43, 'Ya lo arregle ', '2026-05-27 22:14:08.114535+00'),
(52, 5, 42, 'genia!', '2026-05-27 22:21:39.552406+00');

INSERT INTO favorito (usuario_id, libro_id) VALUES
(31, 12), (31, 18), (31, 4), (22, 12), (27, 9), (27, 4), (28, 9), (28, 21), (29, 18), (29, 4),
(22, 21), (39, 18), (39, 16), (30, 9), (40, 6), (32, 13), (29, 9), (32, 9), (17, 12), (17, 15),
(43, 4), (43, 14), (42, 4), (42, 14), (42, 13), (42, 18), (42, 12), (42, 15), (42, 19), (42, 5),
(42, 6), (42, 20), (43, 13), (43, 18), (43, 5), (32, 21), (32, 18), (17, 5), (45, 4), (45, 14);

INSERT INTO medalla (medalla_id, nombre, descripcion, tipo_accion, fecha_creacion) VALUES
(3, 'Super Comentador', 'Por comentar mas de 20 libros', 'comentar', '2025-10-15 22:14:46.175354+00'),
(4, 'Master de la lectura', 'Genio literario y apasionado en orientar a los demás lectores', 'comentar', '2025-11-08 00:30:34.250827+00'),
(5, 'Opinador', 'Has participado en al menos 1 foro', 'participar', '2025-11-15 01:44:06.215751+00'),
(6, 'Comentador', 'Has comentado al menos 1 libro', 'comentar', '2025-11-15 01:45:02.022813+00'),
(2, 'Comentador Activo', 'Has comentado más de 10 libros', 'comentar', '2025-10-15 22:09:14.199253+00'),
(1, 'Debatiente', 'Has participado en más de 10 foros.', 'participar', '2025-10-15 20:27:44.537678+00');

INSERT INTO opinion (opinion_id, usuario_id, libro_id, calificacion, comentario, fecha) VALUES
(11, 22, 12, 4, 'zczfasfas', '2025-10-31 02:31:02.291+00'),
(12, 28, 9, 4, 'excelente', '2025-10-31 23:45:50.731+00'),
(16, 22, 15, 5, 'dsfsdgdfdf', '2025-11-01 00:24:57.632+00'),
(17, 22, 15, 3, 'dasfasdsfasddssad', '2025-11-01 00:30:18.383+00'),
(18, 30, 16, 3, 'Me encanto el libro!', '2025-11-05 16:53:12.573+00'),
(19, 30, 15, 3, E'Espectacular!\n', '2025-11-05 17:14:08.397+00'),
(20, 17, 19, 2, 'Es un libro muy raro', '2025-11-05 17:16:21.893+00'),
(21, 30, 20, 2, 'Me encanto!', '2025-11-05 17:39:01.432+00'),
(22, 30, 12, 1, 'Es Lindo', '2025-11-05 17:57:42.153+00'),
(23, 30, 12, 2, 'mmxsjvcvac', '2025-11-05 18:01:35.847+00'),
(25, 30, 17, 4, 'Super interesante!', '2025-11-06 17:53:19.323+00'),
(26, 30, 16, 2, 'bmkljjer', '2025-11-06 17:55:01.15+00'),
(27, 30, 16, 1, 'sadsafs', '2025-11-06 18:05:56.454+00'),
(28, 28, 9, 5, 'Me encanto!', '2025-11-06 22:02:23.584+00'),
(29, 26, 12, 5, 'Hola', '2025-11-06 22:06:05.338+00'),
(30, 26, 12, 5, 'hola', '2025-11-06 22:07:27.385+00'),
(32, 26, 9, 5, 'hola', '2025-11-06 22:19:29.996+00'),
(33, 26, 9, 3, '123', '2025-11-06 22:20:08.74+00'),
(34, 26, 9, 3, '456', '2025-11-06 22:21:06.331+00'),
(35, 22, 9, 4, 'zxfsfads', '2025-11-06 22:32:19.657+00'),
(36, 29, 4, 5, 'el libro esta genial. super recomendado!!!', '2025-11-07 21:19:25.334+00'),
(37, 29, 10, 4, 'buen libro.', '2025-11-07 21:29:23.963+00'),
(38, 29, 14, 5, 'de lo mejor!!!', '2025-11-07 21:36:39.542+00'),
(39, 29, 18, 5, 'muy buen libro', '2025-11-07 23:16:53.608+00'),
(40, 29, 12, 4, 'fgdgdgd', '2025-11-07 23:47:39.356+00'),
(45, 29, 14, 3, 'bueno', '2025-11-08 00:18:30.911+00'),
(46, 29, 14, 2, 'hola', '2025-11-08 00:20:01.641+00'),
(47, 29, 14, 3, 'Muy buen libro', '2025-11-08 00:20:28.15+00'),
(48, 29, 14, 5, 'bueno', '2025-11-08 00:20:38.249+00'),
(49, 29, 14, 5, 'muy buen libro. el mejor!!!', '2025-11-08 00:25:49.807+00'),
(50, 29, 15, 3, 'perfecto', '2025-11-08 00:33:40.091+00'),
(51, 29, 15, 2, 'no me gusto. muy largo', '2025-11-08 00:34:14.815+00'),
(52, 29, 15, 4, 'muy lindo', '2025-11-08 00:36:28.754+00'),
(53, 22, 9, 3, 'Muy lindo', '2025-11-08 03:50:03.774+00'),
(54, 22, 12, 4, 'Este es mi comentario', '2025-11-13 01:11:26.766+00'),
(56, 25, 16, 5, 'divinoooo!!!', '2025-11-13 21:39:03.676+00'),
(57, 25, 9, 3, 'me gusta', '2025-11-13 21:39:45.855+00'),
(58, 25, 9, 4, 'ñiñiñi', '2025-11-13 22:14:23.44+00'),
(59, 25, 9, 4, 'kjhfddfghjkl', '2025-11-13 22:21:24.231+00'),
(60, 25, 9, 4, 'jkjg', '2025-11-13 22:32:51.963+00'),
(61, 25, 9, 4, 'hdkjdhsfk', '2025-11-13 22:51:56.428+00'),
(67, 22, 16, 1, 'ffffff', '2025-11-14 03:33:20.046+00'),
(68, 22, 19, 4, 'un comentario', '2025-11-15 00:11:02.528+00'),
(69, 25, 19, 5, E'siiii\n', '2025-11-15 15:50:51.835+00'),
(70, 25, 17, 5, 'faaa', '2025-11-15 15:51:31.562+00'),
(71, 25, 15, 5, 'viva bravo!', '2025-11-15 15:51:51.56+00'),
(72, 25, 15, 5, 'a ver de nuevo', '2025-11-15 15:52:01.679+00'),
(73, 25, 15, 5, 'que rico!', '2025-11-15 15:52:13.684+00'),
(74, 25, 10, 5, 'ñiñiñi', '2025-11-15 16:15:24.863+00'),
(75, 25, 16, 5, 'af', '2025-11-15 18:58:02.793+00'),
(76, 22, 12, 5, 'Muy bueno', '2025-11-16 23:09:40.164+00'),
(77, 28, 4, 5, 'esta muy bueno el libro!', '2025-11-18 19:15:46.454+00'),
(78, 28, 18, 5, 'Me encanta', '2025-11-18 19:20:43.358+00'),
(79, 39, 4, 4, 'Fue uno de los primeros libros que realmente me interesaron, increible!', '2025-11-18 23:39:26.144+00'),
(80, 39, 14, 3, 'Libro complicado de leer siendo adolescente.', '2025-11-19 00:44:15.939+00'),
(81, 32, 21, 2, 'Me aburrio', '2025-11-19 01:47:53.783+00'),
(82, 39, 9, 4, '4564132451', '2025-11-19 09:27:35.181+00'),
(83, 38, 9, 5, 'Siempre es una buena ocasión para leerlo.', '2025-11-19 09:39:15.391+00'),
(84, '34', 21, 1, 'Bellísimo', '2025-11-19 13:38:21.297+00'),
(85, 40, 13, 5, 'Librazo pero relargo', '2025-11-19 17:42:00.205+00'),
(86, 32, 13, 5, 'Muy buena presentación!', '2025-11-19 17:42:23.659+00'),
(87, 21, 13, 3, 'Uno de los libros más elegidos este año por los estudiantes de 6to.', '2025-11-19 17:42:30.107+00'),
(88, 32, 13, 3, 'Me encanto', '2025-11-19 17:42:41.091+00'),
(89, 40, 13, 5, 'Muy bueno. Interesante.', '2025-11-19 17:42:53.051+00'),
(90, 29, 18, 4, 'muy bueno', '2025-11-21 03:15:00.44+00'),
(91, 17, 9, 2, 'Holi', '2026-05-27 21:53:36.834+00'),
(92, 17, 10, 1, 'No me gusto', '2026-05-27 21:55:10.419+00'),
(93, 42, 18, 5, 'Excelente novela! ', '2026-05-27 22:11:04.795+00'),
(94, 43, 17, 5, 'woow', '2026-05-27 22:37:23.379+00'),
(95, 43, 5, 5, 'un clásico!!', '2026-05-27 22:38:47.351+00'),
(96, 17, 9, 4, 'muy buen libro', '2026-08-03 18:44:34.172+00'),
(97, 44, 14, 5, 'Excelente libro', '2026-08-03 19:08:43.243+00');

INSERT INTO usuario_medalla (usuario_id, medalla_id, fecha_obtenida) VALUES
(22, 1, '2025-11-14 02:22:46.488014+00'),
(22, 2, '2025-11-15 00:11:03.508222+00'),
(22, 6, '2025-11-15 03:18:31.727387+00'),
(22, 5, '2025-11-15 03:19:32.610526+00'),
(25, 6, '2025-11-15 15:49:31.624423+00'),
(25, 5, '2025-11-15 15:50:52.351825+00'),
(25, 1, '2025-11-15 15:52:01.900299+00'),
(28, 6, '2025-11-18 19:15:48.973851+00'),
(28, 5, '2025-11-18 19:21:58.121737+00'),
(34, 5, '2025-11-18 19:59:05.670537+00'),
(16, 5, '2025-11-18 20:10:30.548543+00'),
(36, 5, '2025-11-18 20:17:45.252199+00'),
(39, 5, '2025-11-18 23:36:10.122457+00'),
(39, 6, '2025-11-18 23:39:02.970211+00'),
(32, 6, '2025-11-19 01:47:55.583685+00'),
(32, 5, '2025-11-19 01:48:34.898274+00'),
(38, 6, '2025-11-19 09:38:53.141258+00'),
(34, 6, '2025-11-19 13:38:33.355273+00'),
(40, 6, '2025-11-19 17:42:00.390773+00'),
(21, 6, '2025-11-19 17:42:30.287599+00'),
(29, 6, '2025-11-20 21:01:54.447809+00'),
(29, 1, '2025-11-21 00:17:50.812795+00'),
(29, 5, '2025-11-21 01:36:37.936873+00'),
(17, 2, '2025-11-08 00:31:28+00'),
(21, 1, '2025-10-15 20:27:44.928744+00'),
(17, 6, '2026-05-27 21:53:37.306618+00'),
(42, 5, '2026-05-27 22:07:51.756741+00'),
(42, 6, '2026-05-27 22:11:05.226587+00'),
(43, 5, '2026-05-27 22:14:08.314841+00'),
(43, 6, '2026-05-27 22:37:23.567135+00'),
(44, 6, '2026-08-03 19:08:43.662599+00');
