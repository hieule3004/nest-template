import { z } from 'nestjs-zod/z';
import { dotenvSchema } from '../dotenv';

export const loglevelSchema = dotenvSchema.shape.LOGLEVEL;
export type LoglevelT = z.infer<typeof loglevelSchema>;
export const loglevel = () => loglevelSchema.parse(process.env.LOGLEVEL);

export const levels = Object.fromEntries(
  loglevelSchema.options.map((v, i) => [v, i]),
);

export const colors: Record<LoglevelT, string> = {
  ERROR: 'red',
  WARN: 'yellow',
  INFO: 'green',
  VERBOSE: 'grey',
  DEBUG: 'blue',
};
