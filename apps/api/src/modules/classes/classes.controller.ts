import { Controller, Get, Param, ParseUUIDPipe, Post, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { ClassesService } from './classes.service';

type Grade = 'GRADE_10' | 'GRADE_11' | 'GRADE_12';
type Medium = 'ENGLISH' | 'KANNADA';

@Controller('classes')
@UseGuards(JwtAuthGuard)
export class ClassesController {
  constructor(private readonly classes: ClassesService) {}

  /** GET /v1/classes/today?grade=GRADE_10&medium=ENGLISH */
  @Get('today')
  today(
    @Query('grade') grade: Grade = 'GRADE_10',
    @Query('medium') medium: Medium = 'ENGLISH',
  ) {
    return this.classes.today(grade, medium);
  }

  /** GET /v1/classes/this-week */
  @Get('this-week')
  thisWeek(
    @Query('grade') grade: Grade = 'GRADE_10',
    @Query('medium') medium: Medium = 'ENGLISH',
  ) {
    return this.classes.thisWeek(grade, medium);
  }

  /** GET /v1/classes/:id */
  @Get(':id')
  one(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.classes.findOne(id);
  }

  /** POST /v1/classes/:id/join — records the student as present in the live room. */
  @Post(':id/join')
  join(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.studentId) throw new UnauthorizedException({ code: 'no_student', message: 'Students only.' });
    return this.classes.join(id, user.studentId);
  }
}
