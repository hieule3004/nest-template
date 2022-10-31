import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingService } from './config/logging/logging.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import { apiPrefix, env, loglevel, port } from './config/env';
import { RequestInterceptor } from './config/http/request.interceptor';
import { HttpExceptionFilter } from './config/http/exception.filter';
import { setupSwagger } from './config/swagger/swagger';

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

  setupSwagger(app);

  // resolve to IPv4
  await app.listen(port(), '0.0.0.0');

  logger.log({
    url: (await app.getUrl()) + apiPrefix(),
    env: env(),
    loglevel: loglevel(),
  });
})();
