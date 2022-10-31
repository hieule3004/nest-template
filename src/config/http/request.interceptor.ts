import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, map, Observable, throwError } from 'rxjs';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class RequestInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        this.logger.debug(data);
        return data;
      }),
      catchError((e) => {
        this.logger.error(e);
        this.logger.debug(e.stack);
        return throwError(() =>
          e instanceof HttpException ? e : new InternalServerErrorException(e),
        );
      }),
    );
  }
}
