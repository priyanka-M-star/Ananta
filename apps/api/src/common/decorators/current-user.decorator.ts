import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type CurrentUserPayload = {
  userId: string;
  role: 'STUDENT' | 'PARENT' | 'TEACHER_ADMIN' | 'SUPER_ADMIN';
  studentId?: string;
  parentId?: string;
};

/**
 * Pulls the JWT-decoded user out of the request.
 * Usage: someHandler(@CurrentUser() user: CurrentUserPayload) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as CurrentUserPayload;
  },
);
