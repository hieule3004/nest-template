import { DotenvT, fromEnv } from '../dotenv';

export type LoglevelT = DotenvT['LOGLEVEL'];

export const loglevel = () => fromEnv('LOGLEVEL');

export const levels: Record<LoglevelT, number> = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  VERBOSE: 4,
};

export const colors: Record<LoglevelT, string> = {
  ERROR: 'red',
  WARN: 'yellow',
  INFO: 'green',
  DEBUG: 'blue',
  VERBOSE: 'grey',
};
