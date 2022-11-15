import { z } from 'nestjs-zod/z';

const dotenvSchema = z
  .object({
    ENV: z.enum(['local', 'dev', 'prod', 'stage']),

    PORT: z.preprocess((a) => {
      const v = Number(a);
      return v;
    }, z.number()),
    API_PREFIX: z.string(),
  })
  // allow unknown keys
  .passthrough();

export const validate = dotenvSchema.parse;
