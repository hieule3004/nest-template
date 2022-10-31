import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod/dto';

const CreateUserBodySchema = z.object({
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

class CreateUserDto extends createZodDto(CreateUserBodySchema) {}

export { CreateUserDto };
