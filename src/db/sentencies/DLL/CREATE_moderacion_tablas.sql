-- Tablas para soporte de moderación de contenido y configuración de IA

CREATE TABLE IF NOT EXISTS configuracion_sistema (
    clave VARCHAR(100) PRIMARY KEY,
    valor TEXT NOT NULL,
    descripcion TEXT,
    actualizado TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incidencia_moderacion (
    incidencia_id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuario(usuario_id) ON DELETE SET NULL,
    contexto VARCHAR(50) NOT NULL,
    contenido_bloqueado TEXT NOT NULL,
    motivo TEXT NOT NULL,
    categoria VARCHAR(100),
    fecha TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incidencia_usuario ON incidencia_moderacion(usuario_id);
CREATE INDEX IF NOT EXISTS idx_incidencia_fecha ON incidencia_moderacion(fecha);
