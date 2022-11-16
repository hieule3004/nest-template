import { Injectable, LoggerService } from '@nestjs/common';
import { createLogger, format, Logger, transports } from 'winston';
import { colors, levels, loglevel } from './logging.utils';
import { LoglevelT } from '../../common/dotenv';

const { colorize, combine, errors, printf, timestamp } = format;

const customFormat = printf(({ level, message, timestamp }) => {
  let value: string;
  if (typeof message === 'object') {
    value = JSON.stringify(message);
  } else {
    value = message;
  }
  return `${timestamp} ${level}\t${value}`;
});

@Injectable()
export class LoggingService implements LoggerService {
  private readonly logger: Logger;

  constructor() {
    this.logger = createLogger({
      level: loglevel(),
      levels,
      defaultMeta: { service: 'api' },
      format: combine(
        colorize({ colors }),
        errors({ stack: true }),
        timestamp(),
        customFormat,
      ),
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
