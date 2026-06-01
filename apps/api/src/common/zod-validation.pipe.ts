import { ArgumentMetadata, BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';

/**
 * Validates a request body / query / param against a zod schema.
 * Usage in a controller:
 *
 *   @Post('login')
 *   login(@Body(new ZodValidationPipe(LoginSchema)) dto: LoginInput) { ... }
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        code: 'validation_error',
        message: 'Request failed validation',
        details: result.error.flatten(),
      });
    }
    return result.data;
  }
}
