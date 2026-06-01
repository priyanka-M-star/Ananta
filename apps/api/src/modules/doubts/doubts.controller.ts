import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { SubmitDoubtSchema, type SubmitDoubtInput } from '@ananta/types';
import { DoubtsService } from './doubts.service';

@Controller('doubts')
export class DoubtsController {
  constructor(private readonly doubts: DoubtsService) {}

  /** POST /v1/doubts — student submits a doubt (typed or voice). */
  @UseGuards(JwtAuthGuard)
  @Post()
  submit(
    @Body(new ZodValidationPipe(SubmitDoubtSchema)) dto: SubmitDoubtInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.studentId) throw new UnauthorizedException({ code: 'no_student', message: 'Students only.' });
    return this.doubts.submit(dto, user.studentId);
  }

  /** GET /v1/doubts/class/:id — chat history for a class. */
  @UseGuards(JwtAuthGuard)
  @Get('class/:id')
  listForClass(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.doubts.listForClass(id);
  }

  /**
   * POST /v1/doubts/:id/answer — internal endpoint hit by the AI worker
   * when an answer is ready. Should be guarded by a shared secret in prod;
   * skipped here for skeleton clarity.
   */
  @Post(':id/answer')
  receiveAnswer(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body('answer') answer: string,
  ) {
    return this.doubts.receiveAnswer(id, answer);
  }
}
