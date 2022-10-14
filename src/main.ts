import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingService } from './logging/logging.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import { apiPrefix, env, loglevel, port } from './common/env.utils';
import { RequestInterceptor } from './http/request.interceptor';
import { HttpExceptionFilter } from './http/exception.filter';
import { Swagger } from './swagger/swagger';

(async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    logger: new LoggingService(),
  });
  const logger = app.get(LoggingService);

  app.useLogger(logger);
  app.setGlobalPrefix(apiPrefix());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new RequestInterceptor(logger));

  Swagger(app);

  // resolve to IPv4
  await app.listen(port(), '0.0.0.0');

  logger.log({
    url: (await app.getUrl()) + apiPrefix(),
    env: env(),
    loglevel: loglevel(),
  });
})();
