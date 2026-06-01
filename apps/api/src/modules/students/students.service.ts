import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PRISMA } from '../../common/prisma.module';
import type { PrismaClient } from '@prisma/client';
import type { StudentOnboardingInput } from '@ananta/types';
import { randomBytes } from 'crypto';

@Injectable()
export class StudentsService {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  /** Create the Student row tied to a User after OTP signup. */
  async onboard(userId: string, dto: StudentOnboardingInput) {
    const existing = await this.prisma.student.findUnique({ where: { userId } });
    if (existing) throw new ConflictException({ code: 'already_onboarded', message: 'Student already exists.' });

    // resolve referral
    let referredById: string | null = null;
    if (dto.referralCode) {
      const ref = await this.prisma.student.findUnique({ where: { referralCode: dto.referralCode } });
      referredById = ref?.id ?? null;
    }

    const ownReferralCode = await this.makeReferralCode(dto.fullName);

    return this.prisma.student.create({
      data: {
        userId,
        fullName: dto.fullName,
        displayName: dto.displayName,
        grade: dto.grade,
        medium: dto.medium,
        school: dto.school,
        city: dto.city,
        pincode: dto.pincode,
        referralCode: ownReferralCode,
        referredById: referredById ?? undefined,
        onboardedAt: new Date(),
      },
    });
  }

  /** GET /v1/students/me */
  async getMine(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: { user: { select: { phone: true, email: true } } },
    });
    if (!student) throw new NotFoundException({ code: 'student_not_found', message: 'Student profile not set up yet.' });
    return student;
  }

  /** GET /v1/students/me/progress — used by dashboard + parent. */
  async getProgress(studentId: string) {
    const [subjects, attendance, quizAttempts, memoryCards] = await Promise.all([
      this.prisma.subject.findMany({ orderBy: { orderIndex: 'asc' } }),
      this.prisma.attendance.count({ where: { studentId, wasPresent: true } }),
      this.prisma.quizAttempt.aggregate({
        where: { studentId, submittedAt: { not: null } },
        _avg: { scorePercent: true },
        _count: { id: true },
      }),
      this.prisma.memoryDeckCard.groupBy({
        by: ['state'],
        where: { studentId },
        _count: { id: true },
      }),
    ]);

    const memoryByState = Object.fromEntries(memoryCards.map((m) => [m.state, m._count.id]));

    return {
      classesAttended: attendance,
      averageQuizPercent: quizAttempts._avg.scorePercent ? Number(quizAttempts._avg.scorePercent) : null,
      quizzesTaken: quizAttempts._count.id,
      memoryDeck: {
        total: Object.values(memoryByState).reduce((a, b) => a + b, 0),
        mastered: memoryByState['MASTERED'] ?? 0,
        learning: memoryByState['LEARNING'] ?? 0,
        reviewing: memoryByState['REVIEWING'] ?? 0,
        new: memoryByState['NEW'] ?? 0,
      },
      subjects: subjects.map((s) => ({ id: s.id, code: s.code, nameEn: s.nameEn, teacherName: s.teacherName })),
    };
  }

  private async makeReferralCode(fullName: string): Promise<string> {
    const prefix = fullName.split(/\s+/)[0]!.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5) || 'STU';
    for (let attempt = 0; attempt < 5; attempt++) {
      const suffix = randomBytes(2).toString('hex').toUpperCase();
      const code = `${prefix}-${suffix}`;
      const exists = await this.prisma.student.findUnique({ where: { referralCode: code } });
      if (!exists) return code;
    }
    return `STU-${randomBytes(4).toString('hex').toUpperCase()}`;
  }
}
