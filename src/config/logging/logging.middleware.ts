import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { LoggingService } from './logging.service';
import { RequestDto } from '../http/dto/request.dto';
import { ResponseDto } from '../http/dto/response.dto';
import { randomUUID } from 'crypto';
import { REQUEST_ID, REQUEST_TIMESTAMP } from '../http/header.utils';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggingService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = randomUUID();
    req.headers[REQUEST_ID] = requestId;
    res.setHeader(REQUEST_ID, requestId);

    req.headers[REQUEST_TIMESTAMP] = Date.now().toString();

    const requestDto = this.buildRequestLog(req);
    this.logger.log(requestDto);

    res.on('finish', () => {
      const responseDto = this.buildResponseLog(req, res);
      this.logger.log(responseDto);
    });

    next();
  }

  private buildRequestLog(req: Request): RequestDto {
    const id = req.headers[REQUEST_ID] as string;
    const url = req.originalUrl;
    const method = req.method;

    return {
      id,
      url,
      method,
    };
  }

  private buildResponseLog(req: Request, res: Response): Partial<ResponseDto> {
    const id = res.getHeader(REQUEST_ID) as string;
    const statusCode = res.statusCode;
    const statusMessage = res.statusMessage;
    const elapsed = Date.now() - Number(req.headers[REQUEST_TIMESTAMP]);

    return {
      id,
      statusCode,
      statusMessage,
      elapsed,
    };
  }
}
