import { Controller, Get, Inject } from '@nestjs/common';
import { PRISMA } from './prisma.module';
import type { PrismaClient } from '@prisma/client';

@Controller('health')
export class HealthController {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  /**
   * Liveness — does the process respond?
   * GET /v1/health
   */
  @Get()
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /**
   * Readiness — can we reach Postgres?
   * GET /v1/health/ready
   */
  @Get('ready')
  async readiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', database: 'up' };
    } catch (err) {
      return { status: 'not-ready', database: 'down', error: String(err) };
    }
  }
}
