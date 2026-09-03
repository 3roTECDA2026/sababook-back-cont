// src/db/connect/db.ts
import 'dotenv/config';
import pgPromise, { IDatabase, IMain } from 'pg-promise';

const connectionString: string | undefined = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const pgp: IMain = pgPromise();
const db: IDatabase<{}> = pgp(connectionString);

const testConnection = async (): Promise<IDatabase<{}>> => {
  try {
    // Usamos una consulta simple para verificar la conexión
    await db.one('SELECT current_timestamp');
    console.log('✅ Database connection established (Remota)');
    return db;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Supabase database connection failed:', message);
    throw error;
  }
};

export { db, pgp, testConnection };