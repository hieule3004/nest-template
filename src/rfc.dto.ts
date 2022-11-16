import { z } from 'zod';
import { createZodDto } from './common/zod';

export const RfcParamSchema = z.object({
  value: z.preprocess(Number, z.number({ required_error: 'must be number' })),
});

export class RfcParam extends createZodDto(RfcParamSchema) {}

export const RfcResponseSchema = z.object({
  // result: z.boolean(),
  result: z
    .intersection(
      z.object({
        a: z.string(),
        b: z.string(),
        c: z.array(z.string()),
        d: z.array(z.string()),
        e: z.object({
          f: z.string(),
        }),
      }),
      z.object({
        a: z.string(),
        b: z.number(),
        c: z.array(z.string()),
        d: z.array(z.number()),
        e: z.object({
          f: z.string(),
        }),
      }),
    )
    .optional(),
});

export class RfcResponse extends createZodDto(RfcResponseSchema) {}
