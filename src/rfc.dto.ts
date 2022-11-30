import { z } from 'zod';
import { createZodDto } from './common/zod';

export const RfcParamSchema = z.object({
  value: z.string(),
});

export class RfcParam extends createZodDto(RfcParamSchema) {}

export const RfcResponseSchema = z.object({
  result: z.boolean(),
});

export class RfcResponse extends createZodDto(RfcResponseSchema) {}
