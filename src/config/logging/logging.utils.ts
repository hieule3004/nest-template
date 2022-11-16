import { loglevelSchema, LoglevelT } from '../../common/dotenv';

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
