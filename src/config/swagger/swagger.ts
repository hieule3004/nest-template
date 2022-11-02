import * as fs from 'fs';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerExplorer } from '@nestjs/swagger/dist/swagger-explorer';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import * as ApiParametersExplorer from '@nestjs/swagger/dist/explorers/api-parameters.explorer';
import {
  ParameterMetadataAccessor,
  ParamWithTypeMetadata,
} from '@nestjs/swagger/dist/services/parameter-metadata-accessor';
import {
  ParameterLocation,
  ParameterObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { patchNestJsSwagger, ZodDto, zodToOpenAPI } from 'nestjs-zod';

function setupSwagger(app: INestApplication) {
  const path = process.env.API_PREFIX || '/api';

  // processor decorate
  groupControllersByPath();
  validateQueryAndParam();
  validateBodyAndResponse();

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

const validateQueryAndParam = () => {
  const _instance = ApiParametersExplorer as any;
  const _method = 'exploreApiParametersMetadata';

  const _accessor = new ParameterMetadataAccessor();
  const t = _instance[_method];
  _instance[_method] = (
    schemas: any,
    instance: any,
    prototype: any,
    method: any,
  ) => {
    Object.values(_accessor.explore(instance, prototype, method) || {})
      .filter((obj) => obj.in !== 'body')
      .map(transformMetadataToParams)
      .forEach((params) => {
        Reflect.defineMetadata(DECORATORS.API_PARAMETERS, params, method);
      });
    return t(schemas, instance, prototype, method);
  };
};

//-- Zod-specific --//

function transformMetadataToParams(
  metadata: ParamWithTypeMetadata,
): ParameterObject[] {
  const inType = metadata.in as ParameterLocation;
  const sObj = zodToOpenAPI((metadata.type as ZodDto).schema);
  const properties = sObj.properties as { [_: string]: SchemaObject };
  const required = new Set(sObj.required);

  return Object.entries(properties).map(([name, { type }]) => ({
    name,
    type,
    in: inType,
    required: required.has(name),
  }));
}

const validateBodyAndResponse = () => {
  patchNestJsSwagger();
};

export { setupSwagger };
