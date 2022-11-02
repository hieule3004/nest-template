import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod/dto';
import * as joi from 'joi';

export const RfcParamSchema = z.object({
  value: z.preprocess(Number, z.number({ required_error: 'must be number' })),
});

export class RfcParam extends createZodDto(RfcParamSchema) {}

export const RfcResponseSchema = z.object({
  result: z.boolean(),
});

export const RfcParamJoiSchema = joi.object({
  value: joi.number(),
});

export class RfcResponse extends createZodDto(RfcResponseSchema) {}
