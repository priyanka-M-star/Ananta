import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PRISMA } from '../../common/prisma.module';
import type { PrismaClient } from '@prisma/client';
import type { SubmitDoubtInput } from '@ananta/types';

@Injectable()
export class DoubtsService {
  private readonly logger = new Logger(DoubtsService.name);

  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    private readonly config: ConfigService,
  ) {}

  /**
   * POST /v1/doubts
   * Persists the doubt, then asks the AI worker to answer asynchronously.
   * The response is returned to the browser immediately (so the UI can show
   * "Praketa is thinking…"); the answer arrives via the WebSocket channel
   * once the AI worker finishes.
   */
  async submit(input: SubmitDoubtInput, studentId: string) {
    const doubt = await this.prisma.doubt.create({
      data: {
        classSessionId: input.classSessionId,
        studentId,
        source: input.source,
        question: input.question,
        questionAudioUrl: input.questionAudioUrl,
        status: 'PENDING',
      },
    });

    // Fire-and-forget — AI worker will POST the answer back into our /doubts/:id/answer hook.
    this.dispatchToAi(doubt.id).catch((err) => {
      this.logger.warn(`AI worker dispatch failed for doubt ${doubt.id}`, err);
    });

    return doubt;
  }

  /** GET /v1/doubts/class/:classSessionId — for live-class chat hydration. */
  async listForClass(classSessionId: string) {
    return this.prisma.doubt.findMany({
      where: { classSessionId },
      include: { student: { select: { displayName: true, fullName: true } } },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
  }

  /**
   * Internal — called by the AI worker to deliver an answer.
   * In production this should be guarded by a shared secret header.
   */
  async receiveAnswer(doubtId: string, answer: string) {
    return this.prisma.doubt.update({
      where: { id: doubtId },
      data: {
        answer,
        status: 'ANSWERED',
        answeredAt: new Date(),
      },
    });
  }

  private async dispatchToAi(doubtId: string): Promise<void> {
    const url = this.config.get<string>('AI_WORKER_URL', 'http://localhost:5000');
    await axios.post(`${url}/doubts/answer`, { doubtId }, { timeout: 5_000 });
  }
}
