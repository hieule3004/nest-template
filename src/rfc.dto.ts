import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod/dto';

export const RfcParamSchema = z.object({
  value: z.preprocess(Number, z.number({ required_error: 'must be number' })),
});

export class RfcParam extends createZodDto(RfcParamSchema) {}