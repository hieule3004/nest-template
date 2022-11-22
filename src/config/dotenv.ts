import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { safeGetInstance } from '../common/resolver';
import { createZodDto } from '../common/zod';

/** ---- dotenv validation schema ---- **/
export const dotenvSchema = z
  .object({
    ENV: z.enum(['local', 'dev', 'prod', 'stage']),
    PORT: z.preprocess(Number, z.number().positive()),
    API_PREFIX: z
      .string()
      .default('/api')
      .transform((s) => (s[0] === '/' ? s : `/${s}`)),
    LOGLEVEL: z.enum(['ERROR', 'WARN', 'INFO', 'VERBOSE', 'DEBUG']),
  })
  // allow unknown keys
  .passthrough();

//---- Utils ----//

export const validate = dotenvSchema.parse;

export type DotenvT = z.infer<typeof dotenvSchema>;

export class DotenvDto extends createZodDto(dotenvSchema) {}

let configService: ConfigService;

export const getConfigService = (app: INestApplication): ConfigService => {
  if (!configService) {
    configService =
      safeGetInstance(app, ConfigService) ??
      new ((ConfigModule.forRoot({ validate }).exports?.find(
        (m: any) => m === ConfigService,
      ) as any) || ConfigService)(process.env);
  }
  return configService;
};
