import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PRISMA } from '../../common/prisma.module';
import type { PrismaClient } from '@prisma/client';
import type { QuizSubmitInput } from '@ananta/types';

@Injectable()
export class QuizzesService {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  /** GET /v1/quizzes/:id — questions only, no answers. */
  async byId(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          select: {
            id: true, orderIndex: true, type: true, difficulty: true,
            textEn: true, textKn: true, options: true, points: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
    if (!quiz) throw new NotFoundException({ code: 'quiz_not_found', message: 'Quiz not found.' });
    return quiz;
  }

  /** POST /v1/quizzes/:id/start — creates a fresh attempt. */
  async start(quizId: string, studentId: string) {
    return this.prisma.quizAttempt.create({
      data: { quizId, studentId },
    });
  }

  /**
   * POST /v1/quizzes/submit
   * Auto-grades by comparing each studentAnswer to the question's correctAnswer.
   * Returns full result, including per-question explanation (only on submit).
   */
  async submit(input: QuizSubmitInput, studentId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: input.attemptId },
      include: { quiz: { include: { questions: true } } },
    });
    if (!attempt || attempt.studentId !== studentId) {
      throw new NotFoundException({ code: 'attempt_not_found', message: 'No such attempt.' });
    }
    if (attempt.submittedAt) {
      throw new NotFoundException({ code: 'already_submitted', message: 'Attempt already submitted.' });
    }

    let totalPoints = 0;
    let earnedPoints = 0;
    const responseRows = [];

    for (const q of attempt.quiz.questions) {
      const r = input.responses.find((x) => x.questionId === q.id);
      const studentAnswer = r?.answer ?? null;
      const isCorrect = this.isCorrect(q.correctAnswer, studentAnswer);
      const pts = isCorrect ? q.points : 0;
      totalPoints += q.points;
      earnedPoints += pts;
      responseRows.push({
        attemptId: attempt.id,
        questionId: q.id,
        studentAnswer: studentAnswer as object,
        isCorrect,
        pointsEarned: pts,
      });
    }

    const scorePercent = totalPoints > 0 ? Number(((earnedPoints / totalPoints) * 100).toFixed(2)) : 0;
    const passed = scorePercent >= attempt.quiz.passPercentage;
    const durationSec = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);

    const [updated] = await this.prisma.$transaction([
      this.prisma.quizAttempt.update({
        where: { id: attempt.id },
        data: {
          submittedAt: new Date(),
          durationSec,
          scorePoints: earnedPoints,
          scorePercent,
          passed,
        },
        include: { quiz: { include: { questions: true } }, responses: true },
      }),
      this.prisma.quizResponse.createMany({ data: responseRows }),
    ]);

    return {
      ...updated,
      explanations: updated.quiz.questions.map((q) => ({
        questionId: q.id,
        explanationEn: q.explanationEn,
        correctAnswer: q.correctAnswer,
      })),
    };
  }

  private isCorrect(correct: unknown, student: unknown): boolean {
    if (student == null) return false;
    return JSON.stringify(correct) === JSON.stringify(student);
  }
}
