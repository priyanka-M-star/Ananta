import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PRISMA } from '../../common/prisma.module';
import type { PrismaClient } from '@prisma/client';
import type { CreateSubscriptionInput } from '@ananta/types';
import { RazorpayService } from './razorpay.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    private readonly razor: RazorpayService,
  ) {}

  /**
   * POST /v1/payments/subscriptions
   * Creates a Razorpay subscription, persists it, returns the short_url so the
   * student's browser can redirect to UPI Auto-Pay setup.
   */
  async createSubscription(studentId: string, input: CreateSubscriptionInput) {
    const plan = await this.prisma.plan.findUnique({ where: { id: input.planId } });
    if (!plan || !plan.isActive) {
      throw new NotFoundException({ code: 'plan_not_found', message: 'Plan not available.' });
    }

    // referral discount
    let discount = 0;
    let referralCodeUsed: string | undefined;
    if (input.referralCode) {
      const referrer = await this.prisma.student.findUnique({ where: { referralCode: input.referralCode } });
      if (referrer && referrer.id !== studentId) {
        discount = 100;
        referralCodeUsed = input.referralCode;
        // referrer gets ₹100 off too — handled when they next renew
      }
    }

    const rzpSub = await this.razor.createSubscription(plan.razorpayPlanId, this.totalCountFor(plan.interval));

    const sub = await this.prisma.subscription.create({
      data: {
        studentId,
        planId: plan.id,
        razorpaySubId: rzpSub.id,
        status: 'CREATED',
        startAt: new Date(),
        amountInr: Number(plan.amountInr) - discount,
        discountInr: discount,
        referralCodeUsed,
      },
    });

    this.logger.log(`Created subscription ${sub.id} (razorpay=${rzpSub.id}) for student ${studentId}`);
    return { subscription: sub, razorpayShortUrl: (rzpSub as { short_url?: string }).short_url };
  }

  /**
   * POST /v1/payments/webhook
   * Receives subscription/payment events from Razorpay. Idempotent — uses
   * razorpayPaymentId as the unique key.
   */
  async handleWebhook(rawBody: string, signature: string) {
    if (!this.razor.verifyWebhookSignature(rawBody, signature)) {
      throw new BadRequestException({ code: 'bad_signature', message: 'Invalid webhook signature.' });
    }
    const event = JSON.parse(rawBody) as { event: string; payload: Record<string, unknown> };

    switch (event.event) {
      case 'subscription.activated':
        return this.markSubscriptionStatus(event.payload, 'ACTIVE');
      case 'subscription.charged':
        return this.recordPayment(event.payload);
      case 'subscription.halted':
        return this.markSubscriptionStatus(event.payload, 'HALTED');
      case 'subscription.cancelled':
        return this.markSubscriptionStatus(event.payload, 'CANCELLED');
      case 'payment.failed':
        return this.recordFailedPayment(event.payload);
      default:
        this.logger.log(`Unhandled webhook: ${event.event}`);
        return { ok: true };
    }
  }

  private totalCountFor(interval: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'): number {
    if (interval === 'MONTHLY') return 12;
    if (interval === 'QUARTERLY') return 4;
    return 1;
  }

  private async markSubscriptionStatus(payload: Record<string, unknown>, status: 'ACTIVE' | 'HALTED' | 'CANCELLED') {
    const sub = (payload.subscription as { entity: { id: string } } | undefined)?.entity;
    if (!sub) return { ok: false };
    await this.prisma.subscription.updateMany({
      where: { razorpaySubId: sub.id },
      data: { status, ...(status === 'CANCELLED' ? { cancelledAt: new Date() } : {}) },
    });
    return { ok: true };
  }

  private async recordPayment(payload: Record<string, unknown>) {
    const payment = (payload.payment as { entity: { id: string; amount: number; method: string; order_id: string } } | undefined)?.entity;
    const sub = (payload.subscription as { entity: { id: string } } | undefined)?.entity;
    if (!payment || !sub) return { ok: false };

    const subscription = await this.prisma.subscription.findUnique({ where: { razorpaySubId: sub.id } });
    if (!subscription) {
      this.logger.warn(`Webhook payment for unknown subscription ${sub.id}`);
      return { ok: false };
    }

    await this.prisma.payment.upsert({
      where: { razorpayPaymentId: payment.id },
      update: { status: 'CAPTURED', paidAt: new Date() },
      create: {
        razorpayPaymentId: payment.id,
        razorpayOrderId: payment.order_id,
        studentId: subscription.studentId,
        subscriptionId: subscription.id,
        amountInr: payment.amount / 100,
        method: this.mapMethod(payment.method),
        status: 'CAPTURED',
        paidAt: new Date(),
      },
    });
    return { ok: true };
  }

  private async recordFailedPayment(payload: Record<string, unknown>) {
    const payment = (payload.payment as { entity: { id: string; amount: number; method: string; error_description?: string } } | undefined)?.entity;
    if (!payment) return { ok: false };
    await this.prisma.payment.upsert({
      where: { razorpayPaymentId: payment.id },
      update: { status: 'FAILED', failureReason: payment.error_description ?? null },
      create: {
        razorpayPaymentId: payment.id,
        amountInr: payment.amount / 100,
        method: this.mapMethod(payment.method),
        status: 'FAILED',
        failureReason: payment.error_description,
        studentId: '00000000-0000-0000-0000-000000000000', // shouldn't happen; safety
      },
    });
    return { ok: true };
  }

  private mapMethod(m: string): 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET' | 'UNKNOWN' {
    if (m === 'upi') return 'UPI';
    if (m === 'card') return 'CARD';
    if (m === 'netbanking') return 'NETBANKING';
    if (m === 'wallet') return 'WALLET';
    return 'UNKNOWN';
  }
}
