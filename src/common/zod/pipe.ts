import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { isZodDto, ZodDto } from './dto';
import { ZodExceptionCreator } from './exception';
import { validate } from './validate';
import { ZodSchema } from 'zod';

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
      if (this.schemaOrDto) {
        return validate(value, this.schemaOrDto, createValidationException);
      }

      const { metatype } = metadata;

      if (!isZodDto(metatype)) {
        return value;
      }

      return validate(value, metatype.schema, createValidationException);
    }
  }

  return ZodValidationPipe;
}

export const ZodValidationPipe = createZodValidationPipe();
