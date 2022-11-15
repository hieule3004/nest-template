import { z } from 'nestjs-zod/z';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';
import { safeGetInstance } from './resolver';

const dotenvSchema = z
  .object({
    // ENV: z.enum(['local', 'dev', 'prod', 'stage']),
    ENV: z.string(),
    PORT: z.string().transform(Number),
    API_PREFIX: z.string(),
  })
  // allow unknown keys
  .passthrough();

export const validate = dotenvSchema.parse;

let configService: ConfigService;

export const getConfigService = (app: INestApplication): ConfigService => {
  if (!configService) {
    configService =
      safeGetInstance(app, ConfigService) ??
      new (ConfigModule.forRoot({ validate }).exports?.find(
        (m: any) => m === ConfigService,
      ) as any)(process.env);
  }
  return configService;
};
