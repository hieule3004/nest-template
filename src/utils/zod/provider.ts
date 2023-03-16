import { Provider } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from './pipe';

export const GlobalZodProvider: Provider = {
  provide: APP_PIPE,
  useClass: ZodValidationPipe,
};
