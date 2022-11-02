import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggingMiddleware } from './logging.middleware';
import { LoggingService } from './logging.service';

@Module({
  providers: [LoggingService],
  exports: [LoggingService],
})
export class LoggingModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggingMiddleware).forRoutes('/');
  }
}
