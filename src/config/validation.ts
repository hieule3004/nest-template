import { Provider } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';

/** ---- Global validation pipe ---- **/
export const GlobalValidationProvider: Provider = {
  provide: APP_PIPE,
  useClass: ZodValidationPipe,
};
