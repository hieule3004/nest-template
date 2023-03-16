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
        return { data };
      }),
      catchError((e) => {
        this.logger.error(e.message);

        const httpException = this.buildException(e);
        this.logger.debug(httpException);
        return throwError(() => httpException);
      }),
    );
  }

  private buildException(err: Error) {
    const exception =
      err instanceof HttpException ? err : new InternalServerErrorException(err, { cause: err });

    const code = exception.getStatus();
    const data = exception.getResponse();

    let message: string;
    let meta: object;
    if (data instanceof Error) {
      message = data.message;
      meta = { ...data };
    } else {
      message = typeof data === 'string' ? data : (data as any).message;
      meta = { ...exception.cause };
    }

    // (exception as any).message = message;
    (exception as any).response = { error: { code, message, meta } };
    return exception;
  }
}
