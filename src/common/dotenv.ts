import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { z } from 'nestjs-zod/z';
import { safeGetInstance } from './resolver';

/** ---- dotenv validation schema ---- **/
export const dotenvSchema = z
  .object({
    ENV: z.enum(['local', 'dev', 'prod', 'stage']),
    PORT: z.string().transform(Number),
    API_PREFIX: z.string(),
    LOGLEVEL: z.enum(['ERROR', 'WARN', 'INFO', 'VERBOSE', 'DEBUG']),
  })
  // allow unknown keys
  .passthrough();

export const loglevelSchema = dotenvSchema.shape.LOGLEVEL;

export type LoglevelT = z.infer<typeof loglevelSchema>;

//---- Helper ----//

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
