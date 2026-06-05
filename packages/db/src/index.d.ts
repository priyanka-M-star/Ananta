import { PrismaClient } from '@prisma/client';
declare global {
    var __prisma: PrismaClient | undefined;
}
/**
 * Single shared Prisma client across the app.
 * In dev, reuse the client across hot-reloads to avoid connection leaks.
 */
export declare const prisma: any;
export * from '@prisma/client';
export type { Prisma } from '@prisma/client';
//# sourceMappingURL=index.d.ts.map