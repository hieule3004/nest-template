export const env = () => (process.env.ENV ?? 'UNKNOWN').toUpperCase();

export const port = () => process.env.PORT ?? 3000;

export const apiPrefix = () => process.env.API_PREFIX ?? '/api';

export { loglevel } from './logging/logging.utils';
