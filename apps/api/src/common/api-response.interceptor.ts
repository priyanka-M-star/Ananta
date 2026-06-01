import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Wraps every successful response in { ok: true, data: ... } per the ApiResponse
 * envelope defined in @ananta/types. Errors are formatted by the global exception
 * filter (NestJS default for now).
 */
@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T, { ok: true; data: T }> {
  intercept(_ctx: ExecutionContext, next: CallHandler<T>): Observable<{ ok: true; data: T }> {
    return next.handle().pipe(map((data) => ({ ok: true as const, data })));
  }
}
