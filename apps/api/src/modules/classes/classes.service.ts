import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PRISMA } from '../../common/prisma.module';
import type { PrismaClient } from '@prisma/client';

@Injectable()
export class ClassesService {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  /**
   * Tonight's class for a given grade + medium.
   * Returns null if there's no class scheduled (e.g. on Sundays).
   */
  async today(grade: 'GRADE_10' | 'GRADE_11' | 'GRADE_12', medium: 'ENGLISH' | 'KANNADA') {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);

    return this.prisma.classSession.findFirst({
      where: {
        grade, medium,
        scheduledStart: { gte: start, lte: end },
      },
      include: {
        subject: true,
        lesson: { select: { id: true, titleEn: true, titleKn: true, summary: true, durationMin: true } },
      },
      orderBy: { scheduledStart: 'asc' },
    });
  }

  /**
   * The seven-day grid for the dashboard's "This week" strip.
   * Monday→Sunday relative to today (Sunday = test+doubts, modelled as a synthetic slot).
   */
  async thisWeek(grade: 'GRADE_10' | 'GRADE_11' | 'GRADE_12', medium: 'ENGLISH' | 'KANNADA') {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const nextMonday = new Date(monday); nextMonday.setDate(monday.getDate() + 7);

    return this.prisma.classSession.findMany({
      where: {
        grade, medium,
        scheduledStart: { gte: monday, lt: nextMonday },
      },
      include: {
        subject: { select: { id: true, code: true, nameEn: true, teacherName: true, themeColor: true, weeklyDay: true } },
        lesson: { select: { id: true, titleEn: true, durationMin: true } },
      },
      orderBy: { scheduledStart: 'asc' },
    });
  }

  /** GET /v1/classes/:id — full details for a single session. */
  async findOne(id: string) {
    const session = await this.prisma.classSession.findUnique({
      where: { id },
      include: {
        subject: true,
        lesson: true,
      },
    });
    if (!session) throw new NotFoundException({ code: 'class_not_found', message: 'No such class.' });
    return session;
  }

  /** POST /v1/classes/:id/join — records the student as present. */
  async join(classSessionId: string, studentId: string) {
    const existing = await this.prisma.attendance.findUnique({
      where: { classSessionId_studentId: { classSessionId, studentId } },
    });
    if (existing) {
      return this.prisma.attendance.update({
        where: { id: existing.id },
        data: { joinedAt: existing.joinedAt ?? new Date(), wasPresent: true, joinMethod: 'webrtc' },
      });
    }
    return this.prisma.attendance.create({
      data: {
        classSessionId, studentId,
        joinedAt: new Date(),
        wasPresent: true,
        joinMethod: 'webrtc',
      },
    });
  }
}
