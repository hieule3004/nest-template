import { INestApplication, Type } from '@nestjs/common';

export const getInstance = <M, T>(
  type: 'imports' | 'controllers' | 'providers',
  app: INestApplication,
  module: Type<M>,
  target: Type<T>,
): T | undefined =>
  (app.select(module) as any).contextModule[type]?.get(target.name);
