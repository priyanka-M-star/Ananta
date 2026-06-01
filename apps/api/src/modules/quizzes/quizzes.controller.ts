import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { QuizSubmitSchema, type QuizSubmitInput } from '@ananta/types';
import { QuizzesService } from './quizzes.service';

@Controller('quizzes')
@UseGuards(JwtAuthGuard)
export class QuizzesController {
  constructor(private readonly quizzes: QuizzesService) {}

  /** GET /v1/quizzes/:id */
  @Get(':id')
  byId(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.quizzes.byId(id);
  }

  /** POST /v1/quizzes/:id/start — opens a fresh attempt. */
  @Post(':id/start')
  start(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.studentId) throw new UnauthorizedException({ code: 'no_student', message: 'Students only.' });
    return this.quizzes.start(id, user.studentId);
  }

  /** POST /v1/quizzes/submit — auto-grades and persists. */
  @Post('submit')
  submit(
    @Body(new ZodValidationPipe(QuizSubmitSchema)) dto: QuizSubmitInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.studentId) throw new UnauthorizedException({ code: 'no_student', message: 'Students only.' });
    return this.quizzes.submit(dto, user.studentId);
  }
}
