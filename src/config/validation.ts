import { Provider } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

/** ---- Global validation pipe ---- **/
export const GlobalValidationProvider: Provider = {
  provide: APP_PIPE,
  useClass: ZodValidationPipe,
};

/** ---- ConfigModule validation schema ---- **/
const dotenvSchema = z
  .object({
    ENV: z.enum(['local', 'dev', 'prod', 'stage']),
    PORT: z.string().transform(Number),
    API_PREFIX: z.string().default('/api'),
  })
  // allow unknown keys
  .passthrough();

export const validate = dotenvSchema.parse;
