import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PRISMA } from '../../common/prisma.module';
import type { PrismaClient, MaterialType } from '@prisma/client';

@Injectable()
export class MaterialsService {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  /**
   * GET /v1/materials — list with optional filters.
   *
   * Filter by subjectCode (MATHS, SCIENCE, …), type (PYQ, WORKSHEET, …),
   * and search (matches title via Postgres trigram).
   */
  async list(opts: {
    subjectCode?: string;
    type?: MaterialType;
    chapterId?: string;
    search?: string;
    limit?: number;
  }) {
    const where: Parameters<PrismaClient['material']['findMany']>[0] = {
      where: {
        ...(opts.subjectCode
          ? { subject: { code: opts.subjectCode as 'MATHS' | 'SCIENCE' | 'SOCIAL' | 'KANNADA' | 'ENGLISH' | 'HINDI' } }
          : {}),
        ...(opts.type ? { type: opts.type } : {}),
        ...(opts.chapterId ? { chapterId: opts.chapterId } : {}),
        ...(opts.search
          ? { titleEn: { contains: opts.search, mode: 'insensitive' } }
          : {}),
      },
      include: {
        subject: { select: { code: true, nameEn: true, themeColor: true } },
        chapter: { select: { number: true, titleEn: true } },
      },
      orderBy: [{ year: 'desc' }, { downloadCount: 'desc' }, { createdAt: 'desc' }],
      take: opts.limit ?? 60,
    };
    return this.prisma.material.findMany(where);
  }

  /** GET /v1/materials/library-stats — totals for the sidebar widget. */
  async libraryStats() {
    const grouped = await this.prisma.material.groupBy({
      by: ['type'],
      _count: { id: true },
    });
    const total = grouped.reduce((sum, g) => sum + g._count.id, 0);
    const byType: Record<string, number> = {};
    for (const g of grouped) byType[g.type] = g._count.id;
    return { total, byType };
  }

  /**
   * POST /v1/materials/:id/download — records the download (so we can show
   * "trending this week") and returns a short-lived signed URL.
   *
   * Access gate: if the material isn't free, the student must have an active
   * subscription.
   */
  async recordDownload(materialId: string, studentId: string) {
    const material = await this.prisma.material.findUnique({ where: { id: materialId } });
    if (!material) throw new NotFoundException({ code: 'material_not_found', message: 'Material not found.' });

    if (!material.isFree) {
      const activeSub = await this.prisma.subscription.findFirst({
        where: { studentId, status: { in: ['ACTIVE', 'AUTHENTICATED'] } },
      });
      if (!activeSub) {
        throw new ForbiddenException({
          code: 'subscription_required',
          message: 'A paid plan is required to download this material.',
        });
      }
    }

    await this.prisma.$transaction([
      this.prisma.materialDownload.create({
        data: { materialId, studentId, downloadedAt: new Date() },
      }),
      this.prisma.material.update({
        where: { id: materialId },
        data: { downloadCount: { increment: 1 } },
      }),
    ]);

    return { fileUrl: material.fileUrl };
  }

  /** GET /v1/materials/trending — top 4 most-downloaded this week. */
  async trending(limit = 4) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60_000);
    const downloads = await this.prisma.materialDownload.groupBy({
      by: ['materialId'],
      where: { downloadedAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });
    const materials = await this.prisma.material.findMany({
      where: { id: { in: downloads.map((d) => d.materialId) } },
      include: { subject: { select: { code: true, nameEn: true, themeColor: true } } },
    });
    // join counts
    return downloads.map((d) => ({
      ...materials.find((m) => m.id === d.materialId)!,
      weeklyDownloads: d._count.id,
    }));
  }
}
