import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import {
  RequestOtpSchema,
  VerifyOtpSchema,
  type RequestOtpInput,
  type VerifyOtpInput,
} from '@ananta/types';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** POST /v1/auth/request-otp */
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('request-otp')
  requestOtp(@Body(new ZodValidationPipe(RequestOtpSchema)) dto: RequestOtpInput) {
    return this.auth.requestOtp(dto);
  }

  /** POST /v1/auth/verify-otp — returns { token, userId, isNew } */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('verify-otp')
  verifyOtp(@Body(new ZodValidationPipe(VerifyOtpSchema)) dto: VerifyOtpInput) {
    return this.auth.verifyOtp(dto);
  }
}
