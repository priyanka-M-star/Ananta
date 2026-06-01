import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Razorpay = require('razorpay');

/**
 * Razorpay client wrapper. Razorpay supports UPI Auto-Pay (the only way
 * recurring payments work for most Indian banks today) through their
 * Subscriptions API.
 *
 * Setup at https://dashboard.razorpay.com/:
 *   1. Create plans matching @ananta/db Plan seeds (plan_monthly_solo etc.)
 *   2. Note KEY_ID and KEY_SECRET → env
 *   3. Configure webhook → https://api.ananta.app/v1/payments/webhook → set WEBHOOK_SECRET
 *      Events: subscription.activated, subscription.charged, subscription.halted, payment.failed
 */
@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private readonly client: InstanceType<typeof Razorpay> | null = null;
  private readonly webhookSecret: string;

  constructor(private readonly config: ConfigService) {
    const keyId = config.get<string>('RAZORPAY_KEY_ID');
    const keySecret = config.get<string>('RAZORPAY_KEY_SECRET');
    this.webhookSecret = config.get<string>('RAZORPAY_WEBHOOK_SECRET', '');

    if (keyId && keySecret) {
      this.client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    } else {
      this.logger.warn('Razorpay credentials not set — payment calls will fail.');
    }
  }

  /** Create a subscription tied to a plan. */
  async createSubscription(planId: string, totalCount = 12) {
    if (!this.client) throw new Error('Razorpay not configured');
    return this.client.subscriptions.create({
      plan_id: planId,
      total_count: totalCount,
      customer_notify: 1,
      // UPI Auto-Pay needs this metadata for some banks
      notes: { source: 'ananta' },
    });
  }

  /** Verify the X-Razorpay-Signature on a webhook. */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.webhookSecret) return false;
    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
    } catch {
      return false;
    }
  }
}
