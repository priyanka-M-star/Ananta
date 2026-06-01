import {
  Body, Controller, Headers, Post, Req, UnauthorizedException, UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { CreateSubscriptionSchema, type CreateSubscriptionInput } from '@ananta/types';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /** POST /v1/payments/subscriptions — start a Razorpay subscription. */
  @UseGuards(JwtAuthGuard)
  @Post('subscriptions')
  createSubscription(
    @Body(new ZodValidationPipe(CreateSubscriptionSchema)) dto: CreateSubscriptionInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!user.studentId) throw new UnauthorizedException({ code: 'no_student', message: 'Students only.' });
    return this.payments.createSubscription(user.studentId, dto);
  }

  /**
   * POST /v1/payments/webhook — Razorpay-only endpoint.
   * NOTE: needs `app.use('/v1/payments/webhook', json({verify: ...}))` to capture raw body
   * for signature verification in production. For this skeleton, we use req.body as JSON.
   */
  @Post('webhook')
  handleWebhook(@Req() req: Request, @Headers('x-razorpay-signature') signature: string) {
    const rawBody = JSON.stringify(req.body);
    return this.payments.handleWebhook(rawBody, signature ?? '');
  }
}
