import { PrismaClient } from '@prisma/client';

// 1. Extensión limpia del objeto global de Node.js
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// 2. Instancia Singleton de Prisma (reutiliza conexión en desarrollo)
export const prisma = global.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// 3. Prueba de conexión con manejo seguro de errores
export const testConnection = async (): Promise<PrismaClient> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection established (Prisma / Supabase)');
    return prisma;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Supabase database connection failed:', message);
    throw error;
  }
};

export default prisma;