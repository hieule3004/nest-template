import { z } from 'zod';
import { createZodDto } from './common/zod';
import { ValidatorType } from './common/validator/rfc';

export const RfcParamSchema = z.object({
  parser: z.enum(Object.keys(ValidatorType) as any),
  value: z.string(),
});

export class RfcParam extends createZodDto(RfcParamSchema) {}

export const RfcResponseSchema = z.object({
  result: z.boolean(),
});

export class RfcResponse extends createZodDto(RfcResponseSchema) {}
