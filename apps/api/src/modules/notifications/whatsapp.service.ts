import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

type TemplateParam = string;

/**
 * Meta WhatsApp Business Cloud API — direct, no BSP middleman.
 *
 * Setup:
 *  - Create a Meta business account, add WhatsApp Business
 *  - Get phone-number-id, permanent access token
 *  - Approve message templates in Meta Business Manager:
 *      - ananta_class_reminder      ({{1}}=name, {{2}}=subject, {{3}}=time)
 *      - ananta_class_attended      ({{1}}=child, {{2}}=quiz_score)
 *      - ananta_class_missed        ({{1}}=child, {{2}}=subject)
 *      - ananta_weekly_digest       ({{1}}=name, {{2}}=attended, {{3}}=score, {{4}}=rank)
 *      - ananta_payment_receipt     ({{1}}=amount, {{2}}=next_billing)
 *
 * Free: first 1,000 conversations/month from Meta, then ~₹0.115 per utility.
 */
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private readonly config: ConfigService) {}

  async sendTemplate(
    phone: string,
    template: string,
    params: TemplateParam[],
    languageCode = 'en',
  ): Promise<void> {
    const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
    if (!phoneNumberId || !accessToken || this.config.get<string>('NODE_ENV') !== 'production') {
      this.logger.warn(`[dev] WhatsApp → +91${phone} · ${template}(${params.join(', ')}) · ${languageCode}`);
      return;
    }

    const body = {
      messaging_product: 'whatsapp',
      to: `91${phone}`,
      type: 'template',
      template: {
        name: template,
        language: { code: languageCode },
        components: [
          {
            type: 'body',
            parameters: params.map((p) => ({ type: 'text', text: p })),
          },
        ],
      },
    };

    try {
      await axios.post(
        `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
        body,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10_000,
        },
      );
      this.logger.log(`WhatsApp sent → +91${phone} · ${template}`);
    } catch (err) {
      this.logger.error(`WhatsApp send failed for ${phone}:${template}`, err);
      throw err;
    }
  }
}
