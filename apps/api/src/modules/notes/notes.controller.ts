import { Controller, Get, Param, ParseUUIDPipe, Post, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { NotesService } from './notes.service';

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  /** GET /v1/notes?subjectCode=SCIENCE&limit=20 */
  @Get()
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('subjectCode') subjectCode?: string,
    @Query('limit') limit?: string,
  ) {
    if (!user.studentId) throw new UnauthorizedException({ code: 'no_student', message: 'Students only.' });
    return this.notes.list(user.studentId, {
      subjectCode,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /** GET /v1/notes/:id */
  @Get(':id')
  one(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.studentId) throw new UnauthorizedException({ code: 'no_student', message: 'Students only.' });
    return this.notes.getOne(id, user.studentId);
  }

  /** POST /v1/notes/:id/mark-downloaded — tracking only. */
  @Post(':id/mark-downloaded')
  markDownloaded(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.studentId) throw new UnauthorizedException({ code: 'no_student', message: 'Students only.' });
    return this.notes.markDownloaded(id, user.studentId);
  }
}
