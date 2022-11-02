export const loglevel = () => (process.env.LOGLEVEL ?? 'INFO').toUpperCase();

export const levels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  VERBOSE: 3,
  DEBUG: 4,
};

export const colors = {
  ERROR: 'red',
  WARN: 'yellow',
  INFO: 'green',
  VERBOSE: 'grey',
  DEBUG: 'blue',
};
