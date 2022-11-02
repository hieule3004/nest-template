import * as fs from 'fs';
import { INestApplication, PipeTransform } from '@nestjs/common';
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
import { patchNestJsSwagger, zodToOpenAPI } from 'nestjs-zod';
import { isZodDto } from 'nestjs-zod/dto';
import { JoiValidationPipe } from '../../common/joi-pipe';
import joiToSwagger from 'joi-to-swagger';
import { ObjectSchema } from 'joi';
import { PIPES_METADATA } from '@nestjs/common/constants';

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
      .map((metadata) => transformMetadataToParams(metadata, method))
      .filter((params) => params)
      .forEach((params) => {
        Reflect.defineMetadata(DECORATORS.API_PARAMETERS, params, method);
      });
    return t(schemas, instance, prototype, method);
  };
};

function transformMetadataToParams(
  metadata: ParamWithTypeMetadata,
  method: any,
): ParameterObject[] {
  const sObj = getSchemaObject(metadata, method);
  if (!sObj) return [];

  const inType = metadata.in as ParameterLocation;
  const properties = sObj.properties as { [_: string]: SchemaObject };
  const required = new Set(sObj.required);

  return Object.entries(properties).map(([name, { type }]) => ({
    name,
    type,
    in: inType,
    required: required.has(name),
  }));
}

//-- Validator-specific --//

function getSchemaObject(metadata: any, method: any): SchemaObject | undefined {
  if (isZodDto(metadata.type)) return zodToOpenAPI(metadata.type.schema);

  const schema = Reflect.getMetadata(PIPES_METADATA, method)?.find(
    (p: PipeTransform) => p instanceof JoiValidationPipe,
  )[`${metadata.in}Schema`];
  if (schema) return joiToSwagger(schema as ObjectSchema).swagger;

  return undefined;
}

const validateBodyAndResponse = () => {
  patchNestJsSwagger();
};

export { setupSwagger };
