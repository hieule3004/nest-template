import * as http from 'http';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { ResponseDto } from './dto/response.dto';
import { REQUEST_ID, REQUEST_TIMESTAMP } from './header.utils';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const id = response.getHeader(REQUEST_ID) as string;
    const statusCode = exception.status;
    const statusMessage = http.STATUS_CODES[statusCode];
    const elapsed = Date.now() - Number(request.headers[REQUEST_TIMESTAMP]);

    response
      .status(statusCode)
      .json({ id, statusCode, statusMessage, elapsed } as ResponseDto);
  }
}
