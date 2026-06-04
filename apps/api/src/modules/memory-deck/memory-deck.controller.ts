import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { MemoryDeckService } from './memory-deck.service';

@Controller('memory-deck')
@UseGuards(JwtAuthGuard)
export class MemoryDeckController {
  constructor(private readonly deck: MemoryDeckService) {}

  /** GET /v1/memory-deck/summary */
  @Get('summary')
  summary(@CurrentUser() user: CurrentUserPayload) {
    if (!user.studentId) throw new UnauthorizedException({ code: 'no_student', message: 'Students only.' });
    return this.deck.summary(user.studentId);
  }

  /** GET /v1/memory-deck/due?limit=50 */
  @Get('due')
  due(
    @CurrentUser() user: CurrentUserPayload,
    @Query('limit') limit?: string,
  ) {
    if (!user.studentId) throw new UnauthorizedException({ code: 'no_student', message: 'Students only.' });
    return this.deck.dueToday(user.studentId, limit ? Number(limit) : 50);
  }

  /**
   * POST /v1/memory-deck/cards/:id/review
   * Body: { quality: 0|1|2|3|4|5 }
   */
  @Post('cards/:id/review')
  review(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { quality: 0 | 1 | 2 | 3 | 4 | 5 },
  ) {
    if (!user.studentId) throw new UnauthorizedException({ code: 'no_student', message: 'Students only.' });
    if (typeof body.quality !== 'number') {
      throw new BadRequestException({ code: 'missing_quality', message: 'quality (0-5) is required' });
    }
    return this.deck.review(id, user.studentId, body.quality);
  }

  /** POST /v1/memory-deck/cards — manual create from the notes view. */
  @Post('cards')
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { front: string; back: string; tags?: string[]; lessonId?: string },
  ) {
    if (!user.studentId) throw new UnauthorizedException({ code: 'no_student', message: 'Students only.' });
    if (!body.front || !body.back) {
      throw new BadRequestException({ code: 'missing_card_fields', message: 'front and back are required' });
    }
    return this.deck.create(user.studentId, body);
  }
}
