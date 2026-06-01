import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

type JwtClaims = {
  userId: string;
  role: CurrentUserPayload['role'];
  studentId?: string;
  parentId?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'change-me'),
    });
  }

  /** What gets attached to `req.user`. Keep it lean — no DB call here. */
  validate(payload: JwtClaims): CurrentUserPayload {
    return {
      userId: payload.userId,
      role: payload.role,
      studentId: payload.studentId,
      parentId: payload.parentId,
    };
  }
}
