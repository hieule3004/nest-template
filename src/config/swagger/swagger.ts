import * as fs from 'fs';
import { INestApplication } from '@nestjs/common';
import { PATH_METADATA, PIPES_METADATA } from '@nestjs/common/constants';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import * as ApiParametersExplorer from '@nestjs/swagger/dist/explorers/api-parameters.explorer';
import * as ApiUseTagsExplorer from '@nestjs/swagger/dist/explorers/api-use-tags.explorer';
import * as ApiResponseExplorer from '@nestjs/swagger/dist/explorers/api-response.explorer';
import { SchemaObjectFactory } from '@nestjs/swagger/dist/services/schema-object-factory';
import { ParameterMetadataAccessor } from '@nestjs/swagger/dist/services/parameter-metadata-accessor';
import {
  ParameterLocation,
  ParameterObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { zodToOpenAPI } from 'nestjs-zod';
import joiToSwagger from 'joi-to-swagger';
import { JoiValidationPipe } from '../../common/joi-pipe';

function setupSwagger(app: INestApplication) {
  const path = process.env.API_PREFIX || '/api';

  // processor decorate
  groupController();
  validateEndpoint();

  const config = new DocumentBuilder()
    .addServer(path)
    .addBasicAuth()
    .addBearerAuth()
    .setTitle(process.env.npm_package_name || '')
    .setDescription(process.env.npm_package_description || '')
    .setVersion(process.env.npm_package_version || '')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
    ignoreGlobalPrefix: true,
    operationIdFactory: (_controllerKey, methodKey) => methodKey,
  });

  fs.writeFile('swagger.json', JSON.stringify(document, null, 2), () => null);

  SwaggerModule.setup(path, app, document);
}

/**
 * Group endpoint by controller path. As method are initialised before class,
 * register callbacks to add ApiTags to each endpoint.
 *
 * Alternative: SwaggerExplorer.exploreGlobalMetadata; less code but more hacky
 * instance[prop] = prototype[prop]; prototype[prop] = () => instance[prop]
 * */
const groupController = () => {
  const _instance = ApiUseTagsExplorer as any;
  const KEY = '__group_path_swagger__';

  // Method override, register callbacks
  const _propM = 'exploreApiTagsMetadata';
  const _superM = _instance[_propM];
  _instance[_propM] = (instance: any, prototype: any, method: any) => {
    let cbs = Reflect.getMetadata(KEY, prototype);
    if (!cbs) {
      cbs = [];
      Reflect.defineMetadata(KEY, cbs, prototype);
    }
    cbs.push((metatype: any) => {
      // add tag to group endpoint
      let metadata = Reflect.getMetadata(PATH_METADATA, metatype);
      metadata = metadata[0] === '/' ? metadata.substring(1) : metadata;
      Reflect.defineMetadata(DECORATORS.API_TAGS, [metadata], metatype);
    });
    return _superM(instance, prototype, method);
  };

  // Class override, execute callbacks
  const _propC = 'exploreGlobalApiTagsMetadata';
  const _superC = _instance[_propC];
  _instance[_propC] = (metatype: any) => {
    const cbs: any[] = Reflect.getMetadata(KEY, metatype.prototype);
    if (cbs) {
      for (const cb of cbs) cb(metatype);
      Reflect.deleteMetadata(KEY, metatype.prototype);
    }
    return _superC(metatype);
  };
};

/**
 * Add request path, query object and body schema
 * */
const validateRequest = () => {
  const _instance: any = ApiParametersExplorer;
  const _prop = 'exploreApiParametersMetadata';

  const _super = _instance[_prop];
  const _accessor = new ParameterMetadataAccessor();
  _instance[_prop] = (
    schemas: any,
    instance: any,
    prototype: any,
    method: any,
  ) => {
    Object.values(_accessor.explore(instance, prototype, method) || {}).forEach(
      (metadata) => {
        const schemaObject = getSchemaObject(metadata, method);
        if (!schemaObject) return;

        if (metadata.in === 'body') {
          // add body schema to swagger
          schemas[metadata.type?.name as string] = schemaObject;
        } else if (metadata.in as ParameterLocation) {
          // add path and query validation to swagger
          const required = new Set(schemaObject.required);
          const params: ParameterObject[] = Object.entries(
            schemaObject.properties as { [_: string]: SchemaObject },
          ).map(([name, { type }]) => ({
            name,
            type,
            in: metadata.in as ParameterLocation,
            required: required.has(name),
          }));
          Reflect.defineMetadata(DECORATORS.API_PARAMETERS, params, method);
        }
      },
    );
    return _super(schemas, instance, prototype, method);
  };
};

/**
 * Add response schema
 * */
const validateResponse = () => {
  const _instance: any = ApiResponseExplorer;
  const _prop = 'exploreApiResponseMetadata';

  const _super = _instance[_prop];
  _instance[_prop] = (
    schemas: any,
    instance: any,
    prototype: any,
    method: any,
  ) => {
    const resp = Reflect.getMetadata(DECORATORS.API_RESPONSE, method) || {};
    Object.values(resp).forEach((metadata: any) => {
      const schemaObject = getSchemaObject(metadata, method);
      if (!schemaObject) return;
      // add response schema to swagger
      schemas[metadata.type?.name as string] = schemaObject;
    });
    return _super(schemas, instance, prototype, method);
  };
};

const validateEndpoint = () => {
  validateRequest();
  validateResponse();

  const _instance: any = SchemaObjectFactory;
  const _prop = 'exploreModelSchema';
  // remove default schema creation, handled manually above
  _instance.prototype[_prop] = function (type: any) {
    if (this.isLazyTypeFunc(type)) type = type();
    return type.name;
  };
};

//---- Validator specific ---//

function getSchemaObject(metadata: any, method: any): SchemaObject | undefined {
  if (metadata.type?.isZodDto) return zodToOpenAPI(metadata.type.schema);

  const location = metadata.in === 'path' ? 'param' : metadata.in ?? 'custom';
  const pipes = Reflect.getMetadata(PIPES_METADATA, method);
  const joiPipe = pipes?.find((p: any) => p instanceof JoiValidationPipe);
  const schema = joiPipe?.[`${location}Schema`];
  if (schema) return joiToSwagger(schema).swagger;

  return undefined;
}

export { setupSwagger };
