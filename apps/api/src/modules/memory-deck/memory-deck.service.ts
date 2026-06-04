import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PRISMA } from '../../common/prisma.module';
import type { PrismaClient } from '@prisma/client';
import { sm2Step, nextStateFor, type Quality } from './sm2';

@Injectable()
export class MemoryDeckService {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  async summary(studentId: string) {
    const [byState, dueToday] = await Promise.all([
      this.prisma.memoryDeckCard.groupBy({
        by: ['state'],
        where: { studentId },
        _count: { id: true },
      }),
      this.prisma.memoryDeckCard.count({
        where: { studentId, dueAt: { lte: new Date() } },
      }),
    ]);
    const counts: Record<string, number> = { NEW: 0, LEARNING: 0, REVIEWING: 0, MASTERED: 0 };
    for (const b of byState) counts[b.state] = b._count.id;
    const total = counts.NEW + counts.LEARNING + counts.REVIEWING + counts.MASTERED;
    return { total, dueToday, ...counts };
  }

  async dueToday(studentId: string, limit = 50) {
    return this.prisma.memoryDeckCard.findMany({
      where: { studentId, dueAt: { lte: new Date() } },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }],
      take: limit,
      include: {
        lesson: { select: { titleEn: true, subject: { select: { code: true, teacherName: true } } } },
      },
    });
  }

  async review(cardId: string, studentId: string, quality: Quality) {
    if (![0, 1, 2, 3, 4, 5].includes(quality)) {
      throw new BadRequestException({ code: 'bad_quality', message: 'quality must be 0–5' });
    }
    const card = await this.prisma.memoryDeckCard.findUnique({ where: { id: cardId } });
    if (!card || card.studentId !== studentId) {
      throw new NotFoundException({ code: 'card_not_found', message: 'Card not found.' });
    }

    const next = sm2Step(
      {
        easeFactor: Number(card.easeFactor),
        intervalDays: card.intervalDays,
        repetitions: card.repetitions,
      },
      quality,
    );
    const state = nextStateFor(quality, next.repetitions);

    return this.prisma.memoryDeckCard.update({
      where: { id: cardId },
      data: {
        easeFactor: next.easeFactor,
        intervalDays: next.intervalDays,
        repetitions: next.repetitions,
        dueAt: next.nextDueAt,
        lastReviewedAt: new Date(),
        state,
      },
    });
  }

  async create(studentId: string, body: { front: string; back: string; tags?: string[]; lessonId?: string }) {
    return this.prisma.memoryDeckCard.create({
      data: {
        studentId,
        front: body.front,
        back: body.back,
        tags: body.tags ?? [],
        lessonId: body.lessonId,
        state: 'NEW',
        dueAt: new Date(),
      },
    });
  }
}
