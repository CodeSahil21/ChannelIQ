import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { env } from './env';

let prisma: PrismaClient;
let pool: Pool;
let isDisconnected = false;

export const connectDb = async (): Promise<void> => {
  if (prisma) return;

  pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  const adapter = new PrismaPg(pool);
  
  prisma = new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  await prisma.$connect();
};

export const disconnectDb = async (): Promise<void> => {
  if (isDisconnected) return;
  
  isDisconnected = true;
  
  if (prisma) {
    await prisma.$disconnect();
  }
  if (pool) {
    await pool.end();
  }
};

export { prisma };