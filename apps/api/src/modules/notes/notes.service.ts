import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PRISMA } from '../../common/prisma.module';
import type { PrismaClient } from '@prisma/client';

@Injectable()
export class NotesService {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  /**
   * GET /v1/notes — list notes the student is allowed to see.
   *
   * "Allowed" = the lesson belongs to their grade + medium AND the student has
   * watched/attended the class (recorded by the Attendance row). The latter
   * keeps catch-up students honest: notes unlock when they watch.
   */
  async list(studentId: string, opts: { subjectCode?: string; limit?: number } = {}) {
    const subjectFilter = opts.subjectCode
      ? { lesson: { subject: { code: opts.subjectCode as 'MATHS' | 'SCIENCE' | 'SOCIAL' | 'KANNADA' | 'ENGLISH' | 'HINDI' } } }
      : {};

    const attendedLessonIds = await this.prisma.attendance.findMany({
      where: { studentId, wasPresent: true },
      select: { classSession: { select: { lessonId: true } } },
    });
    const lessonIds = new Set(attendedLessonIds.map((a) => a.classSession.lessonId));

    const notes = await this.prisma.lessonNote.findMany({
      where: {
        lessonId: { in: Array.from(lessonIds) },
        ...subjectFilter,
      },
      include: {
        lesson: {
          select: {
            id: true, titleEn: true, titleKn: true, durationMin: true,
            subject: { select: { code: true, nameEn: true, teacherName: true, themeColor: true } },
            chapter: { select: { number: true, titleEn: true } },
          },
        },
      },
      orderBy: { generatedAt: 'desc' },
      take: opts.limit ?? 50,
    });
    return notes;
  }

  /** GET /v1/notes/:id — full HTML content. Records a view. */
  async getOne(id: string, studentId: string) {
    const note = await this.prisma.lessonNote.findUnique({
      where: { id },
      include: {
        lesson: {
          include: {
            subject: { select: { code: true, nameEn: true, teacherName: true } },
            chapter: { select: { number: true, titleEn: true } },
          },
        },
      },
    });
    if (!note) throw new NotFoundException({ code: 'note_not_found', message: 'Note not found.' });

    // record the view (idempotent — unique on (noteId, studentId))
    await this.prisma.noteView.upsert({
      where: { noteId_studentId: { noteId: id, studentId } },
      update: { viewedAt: new Date() },
      create: { noteId: id, studentId, viewedAt: new Date() },
    });

    return note;
  }

  /** POST /v1/notes/:id/mark-downloaded — for PDF download analytics. */
  async markDownloaded(id: string, studentId: string) {
    await this.prisma.noteView.upsert({
      where: { noteId_studentId: { noteId: id, studentId } },
      update: { downloadedPdf: true, viewedAt: new Date() },
      create: { noteId: id, studentId, downloadedPdf: true, viewedAt: new Date() },
    });
    return { ok: true };
  }
}
