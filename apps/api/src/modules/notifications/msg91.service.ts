import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * MSG91 — Indian SMS gateway. Used for OTP delivery (DLT-registered).
 *
 * Docs: https://docs.msg91.com/
 * In dev (NODE_ENV !== 'production') we skip the actual SMS and log to the
 * console so we can read the code from terminal output during testing.
 */
@Injectable()
export class Msg91Service {
  private readonly logger = new Logger(Msg91Service.name);

  constructor(private readonly config: ConfigService) {}

  async sendOtp(phone: string, code: string): Promise<void> {
    const authKey = this.config.get<string>('MSG91_AUTH_KEY');
    const templateId = this.config.get<string>('MSG91_TEMPLATE_ID');
    const sender = this.config.get<string>('MSG91_SENDER_ID', 'ANANTA');

    if (!authKey || !templateId || this.config.get<string>('NODE_ENV') !== 'production') {
      this.logger.warn(`[dev] OTP for +91${phone} = ${code}`);
      return;
    }

    try {
      await axios.post(
        'https://control.msg91.com/api/v5/flow/',
        {
          template_id: templateId,
          sender,
          short_url: '0',
          mobiles: `91${phone}`,
          OTP: code,
        },
        {
          headers: { authkey: authKey, 'content-type': 'application/json' },
          timeout: 7_000,
        },
      );
      this.logger.log(`Sent OTP to +91${phone}`);
    } catch (err) {
      this.logger.error(`Failed to send OTP to +91${phone}`, err);
      throw err;
    }
  }
}
