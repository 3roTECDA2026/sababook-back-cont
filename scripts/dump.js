// scripts/dump.js
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

async function dumpDatabase() {
  console.log("⏳ Conectando a la base de datos y preparando la exportación...");

  try {
    // Obtener la lista de tablas del esquema público
    const tables = await db.any(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    if (tables.length === 0) {
      console.log("ℹ️ No se encontraron tablas en el esquema 'public'.");
      process.exit(0);
    }

    console.log(`📋 Tablas encontradas (${tables.length}):`, tables.map(t => t.table_name).join(', '));

    let dumpSql = `-- Backup generado automáticamente para Sababook\n-- Fecha: ${new Date().toISOString()}\n\n`;

    for (const { table_name } of tables) {
      console.log(`Exportando tabla: ${table_name}...`);

      // Obtener las columnas
      const columns = await db.any(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [table_name]);

      dumpSql += `-- Estructura de la tabla: ${table_name}\n`;
      dumpSql += `DROP TABLE IF EXISTS "${table_name}" CASCADE;\n`;
      dumpSql += `CREATE TABLE "${table_name}" (\n`;

      const colDefs = columns.map(c => {
        let def = `  "${c.column_name}" ${c.data_type}`;
        if (c.is_nullable === 'NO') def += ' NOT NULL';
        if (c.column_default) def += ` DEFAULT ${c.column_default}`;
        return def;
      });

      dumpSql += colDefs.join(',\n') + '\n);\n\n';

      // Obtener los datos
      const rows = await db.any(`SELECT * FROM "${table_name}";`);
      if (rows.length > 0) {
        dumpSql += `-- Datos de la tabla: ${table_name}\n`;
        for (const row of rows) {
          const keys = Object.keys(row).map(k => `"${k}"`).join(', ');
          const values = Object.values(row).map(v => {
            if (v === null) return 'NULL';
            if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
            if (v instanceof Date) return `'${v.toISOString()}'`;
            if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
            return v;
          }).join(', ');

          dumpSql += `INSERT INTO "${table_name}" (${keys}) VALUES (${values});\n`;
        }
        dumpSql += '\n';
      }
    }

    const outputPath = path.join(process.cwd(), 'dump.sql');
    fs.writeFileSync(outputPath, dumpSql, 'utf-8');

    console.log(`\n✅ Backup completado con éxito. Guardado en: ${outputPath}`);
  } catch (error) {
    console.error("❌ Error al exportar la base de datos:", error.message);
  } finally {
    pgp.end();
  }
}

dumpDatabase();
