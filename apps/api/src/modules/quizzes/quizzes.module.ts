import { Module } from '@nestjs/common';
import { QuizzesController } from './quizzes.controller';
import { QuizzesByLessonController } from './quizzes-by-lesson.controller';
import { QuizzesService } from './quizzes.service';

@Module({
  controllers: [QuizzesController, QuizzesByLessonController],
  providers: [QuizzesService],
})
export class QuizzesModule {}
