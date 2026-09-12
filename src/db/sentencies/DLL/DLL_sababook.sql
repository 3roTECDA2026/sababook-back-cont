CREATE DATABASE sababook;

-- Tabla: rol
-- El rol se define fuera de Usuario para permitir una gestión más flexible.
CREATE TABLE rol (
    rol_id SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) UNIQUE NOT NULL
);

-- Tabla: usuario
-- Contiene la información básica de todos los usuarios.
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

-- Tabla: libro
-- Almacena los datos de los libros.
CREATE TABLE libro (
    libro_id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(255) NOT NULL,
    genero VARCHAR(100),
    descripcion TEXT,
    portada_url TEXT,
    nivel_educativo VARCHAR(50),
    calificacion_promedio FLOAT,
    activo BOOLEAN NOT NULL DEFAULT true
);

-- Tabla: lista
-- Almacena los datos de los libros.
CREATE TABLE lista (
    lista_id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50), -- tematica, recomendacion, etc.
    fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: lista_lectura
-- Lista de lectura creada por un docente.
CREATE TABLE lista_lectura (
    lista_id INTEGER REFERENCES lista(lista_id) ON DELETE CASCADE,
    docente_id INTEGER REFERENCES usuario(usuario_id),
    descripcion TEXT,
    nivel VARCHAR(50),
    fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (lista_id, docente_id)
);

-- Tabla: lista_libro (intermedia entre lista y libro)
CREATE TABLE lista_libro (
    lista_id INTEGER REFERENCES lista(lista_id) ON DELETE CASCADE,
    libro_id INTEGER REFERENCES libro(libro_id) ON DELETE CASCADE,
    PRIMARY KEY (lista_id, libro_id)
);

-- Tabla: recurso_educativo
-- Recursos adicionales asociados a un libro específico.
CREATE TABLE recurso_educativo (
    recurso_id SERIAL PRIMARY KEY,
    libro_id INTEGER REFERENCES libro(libro_id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- video, audio, enlace, imagen
    url TEXT NOT NULL,
    descripcion TEXT
);

-- Tabla: opinion
-- Opiniones y calificaciones de los libros.
CREATE TABLE opinion (
    opinion_id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuario(usuario_id),
    libro_id INTEGER REFERENCES libro(libro_id),
    calificacion SMALLINT CHECK (calificacion >= 1 AND calificacion <= 5),
    comentario TEXT,
    fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: foro
-- Foros de discusión creados por usuarios.
CREATE TABLE foro (
    foro_id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    creador_id INTEGER REFERENCES usuario(usuario_id),
    fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: comentario_foro
-- Comentarios dentro de los foros.
CREATE TABLE comentario_foro (
    comentario_id SERIAL PRIMARY KEY,
    foro_id INTEGER REFERENCES foro(foro_id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuario(usuario_id),
    contenido TEXT NOT NULL,
    fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: club_lectura
-- Almacena la información de los clubes de lectura.
CREATE TABLE club_lectura (
    club_id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE,
    fecha_fin DATE,
    orador VARCHAR(255)
);

-- Tabla: usuario_club_lectura (tabla intermedia)
CREATE TABLE usuario_club_lectura (
    usuario_id INTEGER REFERENCES usuario(usuario_id),
    club_id INTEGER REFERENCES club_lectura(club_id),
    fecha_ingreso TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    rol_en_club VARCHAR(50),
    PRIMARY KEY (usuario_id, club_id)
);

-- Tabla: medalla
-- Cataloga las medallas que los usuarios pueden ganar.
CREATE TABLE medalla (
    medalla_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    tipo_accion VARCHAR(50), -- leer, opinar, participar, etc.
    fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: usuario_medalla (tabla intermedia)
CREATE TABLE usuario_medalla (
    usuario_id INTEGER REFERENCES usuario(usuario_id),
    medalla_id INTEGER REFERENCES medalla(medalla_id),
    fecha_obtenida TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, medalla_id)
);

-- Tabla: exportacion
-- Registro de las exportaciones de datos
CREATE TABLE exportacion (
    exportacion_id SERIAL PRIMARY KEY,
    fecha_exportacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    usuario_admin_id INTEGER REFERENCES usuario(usuario_id),
    cantidad_opiniones_exportadas INTEGER,
    formato_archivo VARCHAR(50),
    estado VARCHAR(50) -- completado, error, pendiente, etc.
);
CREATE TABLE favorito (
    usuario_id INTEGER NOT NULL,
    libro_id INTEGER NOT NULL,
    estado_lectura VARCHAR(20) NOT NULL DEFAULT 'general',

    -- Define las claves foráneas (Foreign Keys)
    CONSTRAINT fk_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuario (usuario_id)
        ON DELETE CASCADE, -- Opcional: Si el usuario se elimina, se eliminan sus favoritos.

    CONSTRAINT fk_libro
        FOREIGN KEY (libro_id)
        REFERENCES libro (libro_id)
        ON DELETE CASCADE, -- Opcional: Si el libro se elimina, se eliminan las entradas de favorito.

    -- Definir una clave primaria compuesta para evitar favoritos duplicados
    PRIMARY KEY (usuario_id, libro_id)
);