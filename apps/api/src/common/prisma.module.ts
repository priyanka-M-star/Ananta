import { Module, Global } from '@nestjs/common';
import { prisma } from '@ananta/db';

export const PRISMA = 'PRISMA';

@Global()
@Module({
  providers: [{ provide: PRISMA, useValue: prisma }],
  exports: [PRISMA],
})
export class PrismaModule {}
