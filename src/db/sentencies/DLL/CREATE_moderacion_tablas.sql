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
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    revisado_por INTEGER,
    fecha_revision TIMESTAMPTZ,
    fecha TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incidencia_usuario ON incidencia_moderacion(usuario_id);
CREATE INDEX IF NOT EXISTS idx_incidencia_fecha ON incidencia_moderacion(fecha);

-- Seed / Datos de prueba iniciales
INSERT INTO configuracion_sistema (clave, valor, descripcion)
VALUES ('gemini_api_key', '', 'API Key de Google Gemini para moderación de contenido')
ON CONFLICT (clave) DO NOTHING;

INSERT INTO incidencia_moderacion (usuario_id, contexto, contenido_bloqueado, motivo, categoria, estado)
VALUES 
  (1, 'foro', 'Este es un comentario de prueba con palabras ofensivas retenido para revisión.', 'Lenguaje inapropiado detectado por IA', 'lenguaje_inapropiado', 'pendiente'),
  (1, 'opinion', 'Opinión de prueba enviada a la cola de moderación manual.', 'Contenido sospechoso de spam', 'spam', 'pendiente')
ON CONFLICT DO NOTHING;
