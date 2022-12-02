import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { createZodDto } from '../common/zod';
import { GlobalConfigModule } from '../common/config';

const generalSchema = z.object({
  ENV: z.enum(['local', 'dev', 'prod', 'stage']),

  PORT: z.preprocess(Number, z.number().positive()),

  API_PREFIX: z
    .string()
    .default('/api')
    .transform((s) => (s[0] === '/' ? s : `/${s}`)),

  API_TIMEOUT: z.preprocess(Number, z.number().positive()).default(5),

  LOGLEVEL: z.enum(['ERROR', 'WARN', 'INFO', 'VERBOSE', 'DEBUG']),
});

const npmSchema = z.object({
  npm_package_name: z.string(),
  npm_package_description: z.string(),
  npm_package_version: z.string(),
  npm_package_license: z.string(),
});

/** ---- dotenv validation schema ---- **/
export const dotenvSchema = generalSchema.and(npmSchema);

//---- Utils ----//

export const validate = (input: unknown) => {
  const result = dotenvSchema.safeParse(input);
  if (result.success) {
    _env = result.data;
    return result;
  }
  throw result.error;
};

export type DotenvT = z.infer<typeof dotenvSchema>;

export class DotenvDto extends createZodDto(dotenvSchema) {}

let configService: ConfigService;

export const getConfigService = (): ConfigService => {
  if (!configService) {
    configService = new (GlobalConfigModule().exports?.find(
      (m: any) => m === ConfigService,
    ) as any)(process.env);
  }
  return configService;
};

let _env: DotenvT;

export const getEnv = <K extends keyof DotenvT>(key: K) => {
  if (!_env) getConfigService();
  return _env[key];
};
