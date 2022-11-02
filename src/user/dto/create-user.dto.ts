import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod/dto';
import { phoneValidator } from '../../common/validator';

const CreateUserBodySchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  uid: z.preprocess(Number, z.number({ required_error: 'must be number' })),
  props: z.union([z.string(), z.number(), z.boolean()]).array(),
  phone: z
    .string()
    .refine(phoneValidator, { message: 'must be rfc-compliant' })
    .optional(),
  loginDetails: z
    .object({
      password: z.string(),
      confirm: z.string(),
    })
    .refine(({ password, confirm }) => password === confirm, {
      message: 'not match',
    }),
});

class CreateUserDto extends createZodDto(CreateUserBodySchema) {}

export { CreateUserDto };
