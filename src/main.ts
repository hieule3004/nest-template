import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { LoggingService } from './config/logging/logging.service';
import { loglevel } from './config/logging/logging.utils';
import { RequestInterceptor } from './config/http/request.interceptor';
import { HttpExceptionFilter } from './config/http/exception.filter';
import { setupSwagger } from './config/swagger/swagger';
import { getEnv } from './config/dotenv';

(async function bootstrap() {
  // create application
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    logger: new LoggingService(),
  });

  // logger
  const logger = app.get(LoggingService);
  app.useLogger(logger);

  // dotenv
  const apiPrefix = getEnv('API_PREFIX');

  // global options
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new RequestInterceptor(logger));

  // swagger
  setupSwagger(app);

  // start app, resolve host to IPv4
  await app.listen(getEnv('PORT'), '0.0.0.0');

  const url = new URL(apiPrefix, await app.getUrl());
  logger.log({ url, env: getEnv('ENV'), loglevel: loglevel() });
})();
