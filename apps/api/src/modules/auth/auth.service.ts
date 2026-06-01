import { BadRequestException, Inject, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';

import { PRISMA } from '../../common/prisma.module';
import type { PrismaClient } from '@prisma/client';
import { Msg91Service } from '../notifications/msg91.service';
import type { RequestOtpInput, VerifyOtpInput } from '@ananta/types';

const OTP_TTL_MIN = 10;
const OTP_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly msg91: Msg91Service,
  ) {}

  /**
   * Issue a 6-digit OTP. For signup, the user record is created lazily on first
   * verify(). For login, we require a user already exists with that phone.
   */
  async requestOtp(input: RequestOtpInput): Promise<{ sent: true; debug?: string }> {
    const { phone, purpose } = input;

    if (purpose === 'login') {
      const user = await this.prisma.user.findUnique({ where: { phone } });
      if (!user) throw new UnauthorizedException({ code: 'no_user', message: 'No account for this phone. Sign up first.' });
    }

    // generate 6-digit code, hash it, persist with 10 min TTL
    const code = randomInt(100_000, 999_999).toString();
    const codeHash = await bcrypt.hash(code, 8);
    const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60_000);

    await this.prisma.otpCode.create({
      data: { phone, codeHash, purpose, expiresAt },
    });

    await this.msg91.sendOtp(phone, code);

    // In dev, return the code in the response so the founder can test without a phone bill
    const isDev = this.config.get<string>('NODE_ENV') !== 'production';
    return isDev ? { sent: true, debug: code } : { sent: true };
  }

  /**
   * Verify the latest unused OTP for this phone+purpose. On success:
   *   - if purpose=signup and no user exists, create one
   *   - issue a JWT
   */
  async verifyOtp(input: VerifyOtpInput): Promise<{ token: string; userId: string; isNew: boolean }> {
    const { phone, code, purpose } = input;

    const otp = await this.prisma.otpCode.findFirst({
      where: { phone, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) throw new UnauthorizedException({ code: 'otp_invalid', message: 'No active code for this phone.' });
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new UnauthorizedException({ code: 'otp_attempts_exceeded', message: 'Too many tries. Request a new code.' });
    }

    const ok = await bcrypt.compare(code, otp.codeHash);
    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: otp.attempts + 1, ...(ok ? { consumedAt: new Date() } : {}) },
    });
    if (!ok) throw new UnauthorizedException({ code: 'otp_wrong', message: 'That code is not right.' });

    // resolve / create user
    let user = await this.prisma.user.findUnique({ where: { phone } });
    let isNew = false;
    if (!user) {
      if (purpose !== 'signup') {
        throw new UnauthorizedException({ code: 'no_user', message: 'No account. Sign up first.' });
      }
      user = await this.prisma.user.create({
        data: {
          phone,
          role: 'STUDENT',
          phoneVerifiedAt: new Date(),
          lastLoginAt: new Date(),
        },
      });
      isNew = true;
    } else {
      await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    }

    const token = await this.signToken(user.id, user.role);
    this.logger.log(`Auth: ${isNew ? 'signed up' : 'logged in'} user ${user.id}`);
    return { token, userId: user.id, isNew };
  }

  private async signToken(userId: string, role: string): Promise<string> {
    // resolve student/parent id if applicable so downstream guards can use it
    const [student, parent] = await Promise.all([
      this.prisma.student.findUnique({ where: { userId }, select: { id: true } }),
      this.prisma.parent.findUnique({ where: { userId }, select: { id: true } }),
    ]);
    return this.jwt.signAsync({
      userId,
      role,
      studentId: student?.id,
      parentId: parent?.id,
    });
  }
}
