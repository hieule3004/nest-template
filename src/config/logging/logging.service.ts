import { ConsoleLogger, Injectable } from '@nestjs/common';
import { createLogger, format, Logger, transports } from 'winston';
import { colors, levels, loglevel, LoglevelT } from './logging.utils';

const { colorize, combine, errors, printf, timestamp } = format;

const customFormat = printf((info) => {
  const { level, message, timestamp, stack, cause } = info;
  const value: string = typeof message === 'object' ? JSON.stringify(message) : message;

  const template = `${timestamp} ${level}\t${value}`;
  if (stack) {
    const trace = [];
    for (let err = info; err; err = err.cause) trace.push(err.stack);
    const stacktrace = trace.map((s, i) => `[${i}] ${s}`).join('\n');
    return `${template}\n${stacktrace}`;
  }
  return template;
});

@Injectable()
export class LoggingService extends ConsoleLogger {
  private readonly logger: Logger;

  constructor() {
    super();
    this.logger = createLogger({
      level: loglevel(),
      levels,
      defaultMeta: { service: 'api' },
      format: combine(errors({ stack: true }), colorize({ colors }), timestamp(), customFormat),
      transports: [new transports.Console()],
    });
  }

  log(message: any): void {
    this._log('INFO', message);
  }

  error(message: any): void {
    this._log('ERROR', message);
  }

  warn(message: any): void {
    this._log('WARN', message);
  }

  debug(message: any): void {
    this._log('DEBUG', message);
  }

  verbose(message: any): void {
    this._log('VERBOSE', message);
  }

  private _log(level: LoglevelT, message: any): void {
    if (typeof message === 'undefined') return;
    this.logger.log(level, { message });
  }
}
