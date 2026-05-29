import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Single shared Prisma client across the app.
 * In dev, reuse the client across hot-reloads to avoid connection leaks.
 */
export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export * from '@prisma/client';
export type { Prisma } from '@prisma/client';
