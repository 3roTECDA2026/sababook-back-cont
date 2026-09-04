import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export const testConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection established (Prisma / Supabase)');
    return prisma;
  } catch (error: any) {
    console.error('❌ Supabase database connection failed:', error.message);
    throw error;
  }
};

export default prisma;