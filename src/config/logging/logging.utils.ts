import { DotenvT, getEnv } from '../dotenv';

export type LoglevelT = DotenvT['LOGLEVEL'];

export const loglevel = () => getEnv('LOGLEVEL');

export const levels: Record<LoglevelT, number> = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  VERBOSE: 3,
  DEBUG: 4,
};

export const colors: Record<LoglevelT, string> = {
  ERROR: 'red',
  WARN: 'yellow',
  INFO: 'green',
  VERBOSE: 'grey',
  DEBUG: 'blue',
};
