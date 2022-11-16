import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { ResponseDto } from './dto/response.dto';
import * as statuses from 'statuses';
import { REQUEST_ID } from './header.utils';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = exception.status;

    const id = response.getHeader(REQUEST_ID) as string;
    const statusMessage = statuses(statusCode);
    response
      .status(statusCode)
      .json({ id, statusCode, statusMessage } as ResponseDto);
  }
}
