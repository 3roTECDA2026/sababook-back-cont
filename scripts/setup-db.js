// scripts/setup-db.js
import 'dotenv/config';
import pgPromise from 'pg-promise';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ Error: DATABASE_URL no está definida en el archivo .env");
  process.exit(1);
}

const pgp = pgPromise();
const db = pgp(connectionString);

async function setupDatabase() {
  console.log("⏳ Conectando a la base de datos de Supabase para inicializar la base de datos...");

  try {
    // 1. Eliminar tablas existentes para una inicialización limpia
    console.log("🧹 Limpiando tablas existentes...");
    await db.none(`
      DROP TABLE IF EXISTS favorito, exportacion, usuario_medalla, medalla, usuario_club_lectura, 
                         club_lectura, comentario_foro, foro, opinion, recurso_educativo, 
                         lista_libro, lista_lectura, lista, libro, usuario, rol CASCADE;
    `);

    // 2. Crear Estructura DDL (Tablas e Índices)
    const ddlPath = path.join(process.cwd(), 'src', 'db', 'sentencies', 'DLL', 'DLL_sababook.sql');
    let ddlSql = fs.readFileSync(ddlPath, 'utf-8');

    // Remover "CREATE DATABASE sababook;" si existe
    ddlSql = ddlSql.replace(/CREATE DATABASE\s+[^;]+;/gi, '');

    console.log("🛠️  Creando esquema de tablas y relaciones...");
    await db.none(ddlSql);
    console.log("✅ Tablas creadas correctamente.");

    // 3. Insertar Datos Semilla DML (Roles, Usuarios, Libros, Medallas, etc.)
    const dmlPath = path.join(process.cwd(), 'src', 'models', 'DML', 'DML_Insert_sababook.sql');
    if (fs.existsSync(dmlPath)) {
      console.log("🌱 Insertando datos iniciales (Roles, Usuarios, Libros, Medallas, Foros)...");
      const dmlSql = fs.readFileSync(dmlPath, 'utf-8');
      await db.none(dmlSql);
      console.log("✅ Datos iniciales cargados con éxito.");
    }

    console.log("\n🚀 ¡La base de datos se ha inicializado y poblado por completo!");
  } catch (error) {
    console.error("❌ Error durante la inicialización de la base de datos:", error.message);
  } finally {
    pgp.end();
  }
}

setupDatabase();
