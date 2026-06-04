import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuizzesService } from './quizzes.service';

/**
 * Tiny companion controller for resolving a quiz by the lesson it belongs to.
 * Lives under /v1/lessons to give frontends a clean URL to use from the
 * post-class page without first knowing the quiz id.
 */
@Controller('lessons')
@UseGuards(JwtAuthGuard)
export class QuizzesByLessonController {
  constructor(private readonly quizzes: QuizzesService) {}

  /** GET /v1/lessons/:lessonId/quiz — returns the quiz (or null) for a lesson. */
  @Get(':lessonId/quiz')
  forLesson(@Param('lessonId', new ParseUUIDPipe()) lessonId: string) {
    return this.quizzes.forLesson(lessonId);
  }
}
