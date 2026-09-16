import 'dotenv/config'; 
import pgPromise from 'pg-promise';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL environment variable is not set.");
  process.exit(1);
}

const pgp = pgPromise();
const db = pgp(connectionString);

const testConnection = async () => {
  try {
    // Usamos una consulta simple para verificar la conexión
    await db.one('SELECT current_timestamp'); 
    console.log('✅ Database connection established (Remota)');
    return db;
  } catch (error) {
    console.error('❌ Supabase database connection failed:', error.message);
    console.warn('⚠️  Tu proyecto en Supabase está PAUSADO o la DATABASE_URL del .env ha cambiado.');
    console.warn('👉 Por favor reanuda tu proyecto en https://supabase.com/dashboard');
  }
};


export { db, pgp ,testConnection};