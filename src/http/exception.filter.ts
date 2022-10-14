import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { ResponseDto } from './dto/response.dto';
import * as statuses from 'statuses';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = exception.status;

    response.status(statusCode).json({
      statusCode,
      statusMessage: statuses(statusCode),
    } as ResponseDto);
  }
}
