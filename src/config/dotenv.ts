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
  LOGLEVEL: z.enum(['ERROR', 'WARN', 'INFO', 'VERBOSE', 'DEBUG']),
});

const npmSchema = z.object({
  npm_package_name: z.string(),
  npm_package_description: z.string(),
  npm_package_version: z.string(),
  npm_package_license: z.string(),
});

const featureSchema = z
  .object({
    FEATURE_ON: z.enum(['true', 'false']).default('false'),
    FEATURE_KEY: z.string().min(1),
    FEATURE_VALUE: z.string().min(1),
  })
  .partial()
  .refine(
    ({ FEATURE_ON, FEATURE_KEY, FEATURE_VALUE }) =>
      !FEATURE_ON || (FEATURE_KEY && FEATURE_VALUE),
    { message: 'feature on requires its env vars' },
  );

/** ---- dotenv validation schema ---- **/
export const dotenvSchema = generalSchema.and(npmSchema).and(featureSchema);

//---- Utils ----//

export const validate = (input: unknown) => {
  const result = dotenvSchema.safeParse(input);
  if (result.success) return result;
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

export const getEnv = <K extends keyof DotenvT>(key: K) =>
  getConfigService().get(key) as DotenvT[K];
