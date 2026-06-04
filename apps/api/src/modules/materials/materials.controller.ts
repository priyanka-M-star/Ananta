import { Controller, Get, Param, ParseUUIDPipe, Post, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { MaterialsService } from './materials.service';
import type { MaterialType } from '@prisma/client';

@Controller('materials')
@UseGuards(JwtAuthGuard)
export class MaterialsController {
  constructor(private readonly materials: MaterialsService) {}

  /** GET /v1/materials?subjectCode=SCIENCE&type=PYQ&search=2024 */
  @Get()
  list(
    @Query('subjectCode') subjectCode?: string,
    @Query('type') type?: MaterialType,
    @Query('chapterId') chapterId?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    return this.materials.list({
      subjectCode,
      type,
      chapterId,
      search,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /** GET /v1/materials/library-stats — sidebar widget. */
  @Get('library-stats')
  stats() {
    return this.materials.libraryStats();
  }

  /** GET /v1/materials/trending */
  @Get('trending')
  trending(@Query('limit') limit?: string) {
    return this.materials.trending(limit ? Number(limit) : 4);
  }

  /** POST /v1/materials/:id/download */
  @Post(':id/download')
  download(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.studentId) throw new UnauthorizedException({ code: 'no_student', message: 'Students only.' });
    return this.materials.recordDownload(id, user.studentId);
  }
}
