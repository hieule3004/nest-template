import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { RequestLogDto } from 'src/config/logging/dto/request-log.dto';
import { ResponseLogDto } from 'src/config/logging/dto/response-log.dto';
import { LoggingService } from 'src/config/logging/logging.service';
import { decodeTime, ulid } from 'ulid';

export const REQUEST_ID = 'X-Request-ID';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggingService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // set custom request id
    const requestId = ulid();
    req.headers[REQUEST_ID] = requestId;
    res.setHeader(REQUEST_ID, requestId);

    const requestDto = this.buildRequestLog(req);
    this.logger.log(requestDto);

    res.on('finish', () => {
      const responseDto = this.buildResponseLog(res);
      this.logger.log(responseDto);
    });

    next();
  }

  private buildRequestLog(req: Request): RequestLogDto {
    const requestId = req.headers[REQUEST_ID] as string;
    const url = req.originalUrl;
    const method = req.method;

    return { requestId, method, url };
  }

  private buildResponseLog(res: Response): ResponseLogDto {
    const requestId = res.getHeader(REQUEST_ID) as string;
    const code = res.statusCode;
    const message = res.statusMessage;
    const elapsed = Date.now() - decodeTime(requestId);

    return { requestId, code, message, elapsed };
  }
}
