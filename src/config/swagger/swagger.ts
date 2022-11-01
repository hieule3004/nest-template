import * as fs from 'fs';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { patchNestJsSwagger } from 'nestjs-zod';
import { SwaggerExplorer } from '@nestjs/swagger/dist/swagger-explorer';
import { DECORATORS } from '@nestjs/swagger/dist/constants';

function setupSwagger(app: INestApplication) {
  const path = process.env.API_PREFIX || '/api';

  // processor decorate
  groupControllersByPath();
  validateDto();

  const config = new DocumentBuilder()
    .addServer(path)
    .addBearerAuth()
    .setTitle(process.env.npm_package_name || 'Swagger')
    .setDescription(process.env.npm_package_description || '')
    .setVersion(process.env.npm_package_version || '1')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
    ignoreGlobalPrefix: true,
    operationIdFactory: (_controllerKey, methodKey) => methodKey,
  });

  fs.writeFile(
    'swagger.json',
    JSON.stringify(document, null, 2),
    () => undefined,
  );

  SwaggerModule.setup(path, app, document);
}

const validateDto = () => {
  patchNestJsSwagger();
};

const groupControllersByPath = () => {
  const instance = SwaggerExplorer as any;
  const method = 'exploreGlobalMetadata';

  // override instance to contextualise `this`
  instance[method] = instance.prototype[method];
  // override prototype to add custom behaviour
  instance.prototype[method] = (metatype: any) => {
    if (!Reflect.hasMetadata(DECORATORS.API_TAGS, metatype)) {
      let metadata = Reflect.getMetadata('path', metatype);
      metadata = metadata[0] === '/' ? metadata : `/${metadata}`;
      Reflect.defineMetadata(DECORATORS.API_TAGS, [metadata], metatype);
    }
    return instance[method](metatype);
  };
};

export { setupSwagger };
