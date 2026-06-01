import { Body, Controller, Get, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { StudentOnboardingSchema, type StudentOnboardingInput } from '@ananta/types';
import { StudentsService } from './students.service';

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  /** POST /v1/students/onboard — first call after signup. */
  @Post('onboard')
  onboard(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(StudentOnboardingSchema)) dto: StudentOnboardingInput,
  ) {
    return this.students.onboard(user.userId, dto);
  }

  /** GET /v1/students/me */
  @Get('me')
  getMe(@CurrentUser() user: CurrentUserPayload) {
    return this.students.getMine(user.userId);
  }

  /** GET /v1/students/me/progress — aggregated dashboard numbers. */
  @Get('me/progress')
  getMyProgress(@CurrentUser() user: CurrentUserPayload) {
    if (!user.studentId) throw new UnauthorizedException({ code: 'no_student', message: 'Not a student account.' });
    return this.students.getProgress(user.studentId);
  }
}
