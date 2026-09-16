import 'dotenv/config';
import pgPromise from 'pg-promise';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ Error: DATABASE_URL no está definida en .env");
  process.exit(1);
}

const pgp = pgPromise();
const db = pgp(connectionString);

async function runMigration() {
  console.log("⏳ Conectando a Supabase para aplicar migraciones de Cafés Literarios...");

  try {
    // 1. Crear tabla cafe_literario
    await db.none(`
      CREATE TABLE IF NOT EXISTS cafe_literario (
        cafe_id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        libro_id INTEGER REFERENCES libro(libro_id) ON DELETE SET NULL,
        docente_id INTEGER REFERENCES usuario(usuario_id) ON DELETE SET NULL,
        fecha_evento TIMESTAMPTZ NOT NULL,
        lugar VARCHAR(255) DEFAULT 'Biblioteca Ernesto Sábato',
        estado VARCHAR(50) DEFAULT 'programado',
        fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Tabla 'cafe_literario' lista.");

    // 2. Crear tabla asistencia_cafe
    await db.none(`
      CREATE TABLE IF NOT EXISTS asistencia_cafe (
        asistencia_id SERIAL PRIMARY KEY,
        cafe_id INTEGER REFERENCES cafe_literario(cafe_id) ON DELETE CASCADE,
        usuario_id INTEGER REFERENCES usuario(usuario_id) ON DELETE CASCADE,
        estado VARCHAR(50) DEFAULT 'confirmado',
        fecha_registro TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_asistencia_usuario_cafe UNIQUE (cafe_id, usuario_id)
      );
    `);
    console.log("✅ Tabla 'asistencia_cafe' lista.");

    // 3. Crear tabla voto_cafe
    await db.none(`
      CREATE TABLE IF NOT EXISTS voto_cafe (
        voto_id SERIAL PRIMARY KEY,
        cafe_id INTEGER REFERENCES cafe_literario(cafe_id) ON DELETE CASCADE,
        usuario_id INTEGER REFERENCES usuario(usuario_id) ON DELETE CASCADE,
        voto BOOLEAN NOT NULL,
        fecha_voto TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_voto_usuario_cafe UNIQUE (cafe_id, usuario_id)
      );
    `);
    console.log("✅ Tabla 'voto_cafe' lista.");

    // 4. Agregar columna cafe_id a la tabla foro
    await db.none(`
      ALTER TABLE foro 
      ADD COLUMN IF NOT EXISTS cafe_id INTEGER REFERENCES cafe_literario(cafe_id) ON DELETE CASCADE;
    `);
    console.log("✅ Columna 'cafe_id' agregada a tabla 'foro'.");

    // 5. Insertar un Café Literario inicial de prueba si no hay ninguno
    const countResult = await db.one(`SELECT COUNT(*) FROM cafe_literario`);
    if (parseInt(countResult.count) === 0) {
      console.log("🌱 Insertando Café Literario de ejemplo...");

      // Buscar un libro y docente existentes
      const libro = await db.oneOrNone(`SELECT libro_id FROM libro LIMIT 1`);
      const docente = await db.oneOrNone(`SELECT usuario_id FROM usuario WHERE rol_id = 2 OR rol_id = 3 LIMIT 1`);

      const libroId = libro ? libro.libro_id : null;
      const docenteId = docente ? docente.usuario_id : 1;

      const cafe = await db.one(`
        INSERT INTO cafe_literario (titulo, descripcion, libro_id, docente_id, fecha_evento, lugar)
        VALUES (
          'Café Literario: Distopías y Sociedad',
          'Nos reunimos en la biblioteca para debatir los temas principales de la obra propuesta y compartir un café con alumnos y profesores.',
          $1, $2, CURRENT_TIMESTAMP + INTERVAL '7 days', 'Biblioteca Ernesto Sábato'
        )
        RETURNING cafe_id
      `, [libroId, docenteId]);

      // Crear foro asociado al café de ejemplo
      await db.none(`
        INSERT INTO foro (titulo, descripcion, creador_id, cafe_id)
        VALUES (
          'Foro de Debate: Café Literario de Distopías',
          'Espacio para dejar opiniones y preguntas sobre la lectura propuesta para el Café Literario.',
          $1, $2
        )
      `, [docenteId, cafe.cafe_id]);

      console.log("✅ Café Literario de prueba creado exitosamente.");
    }

    console.log("\n🚀 ¡Migración de Cafés Literarios completada con éxito!");
  } catch (error) {
    console.error("❌ Error al ejecutar la migración:", error.message);
  } finally {
    pgp.end();
  }
}

runMigration();
