import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Apply with @UseGuards(JwtAuthGuard) on a controller or route.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
