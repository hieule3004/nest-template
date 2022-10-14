import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function Swagger(app: INestApplication) {
  const path = process.env.API_PREFIX || '/api';
  const config = new DocumentBuilder()
    .addServer(path)
    .addBearerAuth()
    .setTitle(process.env.npm_package_name || 'Swagger')
    .setDescription(process.env.npm_package_description || '')
    .setVersion(process.env.npm_package_version || '1')
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    ignoreGlobalPrefix: true,
    operationIdFactory: (_controllerKey, methodKey) => methodKey,
  });
  SwaggerModule.setup(path, app, document);
}
