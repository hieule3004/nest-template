import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { LoggingService } from './logging.service';
import { RequestDto } from '../http/dto/request.dto';
import { ResponseDto } from '../http/dto/response.dto';
import { randomUUID } from 'crypto';
import { REQUEST_ID } from '../http/header.utils';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggingService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = randomUUID();
    req.headers[REQUEST_ID] = requestId;
    res.setHeader(REQUEST_ID, requestId);

    const requestDto = this.buildRequestLog(req);
    const start = Date.now();
    this.logger.log(requestDto);

    res.on('finish', () => {
      const responseDto = this.buildResponseLog(res);
      responseDto.elapsed = Date.now() - start;
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

  private buildResponseLog(res: Response): Partial<ResponseDto> {
    const id = res.getHeader(REQUEST_ID) as string;
    const statusCode = res.statusCode;
    const statusMessage = res.statusMessage;
    return {
      id,
      statusCode,
      statusMessage,
    };
  }
}
