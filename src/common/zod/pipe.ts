import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { isZodDto, ZodDto } from './dto';
import { ZodExceptionCreator } from './exception';
import { validate } from './validate';

interface ZodValidationPipeOptions {
  createValidationException?: ZodExceptionCreator;
}

type ZodValidationPipeClass = new (
  schemaOrDto?: ZodSchema | ZodDto,
) => PipeTransform;

export function createZodValidationPipe({
  createValidationException,
}: ZodValidationPipeOptions = {}): ZodValidationPipeClass {
  @Injectable()
  class ZodValidationPipe implements PipeTransform {
    private schemaOrDto?: ZodSchema | ZodDto;

    public transform(value: unknown, metadata: ArgumentMetadata) {
      // validate instance
      if (this.schemaOrDto)
        return validate(value, this.schemaOrDto, createValidationException);

      const { metatype } = metadata;

      // ignore unknown dto or schema
      if (!isZodDto(metatype)) return value;

      // validate zod dto or schema
      return validate(value, metatype.schema, createValidationException);
    }
  }

  return ZodValidationPipe;
}

export const ZodValidationPipe = createZodValidationPipe();
