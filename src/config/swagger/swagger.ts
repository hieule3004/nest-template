import * as fs from 'fs';
import { INestApplication, PipeTransform } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PATH_METADATA, PIPES_METADATA } from '@nestjs/common/constants';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import * as ApiParametersExplorer from '@nestjs/swagger/dist/explorers/api-parameters.explorer';
import * as ApiUseTagsExplorer from '@nestjs/swagger/dist/explorers/api-use-tags.explorer';
import { ParameterMetadataAccessor } from '@nestjs/swagger/dist/services/parameter-metadata-accessor';
import {
  ParameterLocation,
  ParameterObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { patchNestJsSwagger, zodToOpenAPI } from 'nestjs-zod';
import { isZodDto } from 'nestjs-zod/dto';
import { ObjectSchema } from 'joi';
import joiToSwagger from 'joi-to-swagger';
import { JoiValidationPipe } from '../../common/joi-pipe';

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

/**
 * Group endpoint by controller path. As method are initialised before class,
 * register callbacks to add ApiTags to each endpoint.
 *
 * Alternative: SwaggerExplorer.exploreGlobalMetadata; less code but more hacky
 * instance[prop] = prototype[prop]; prototype[prop] = () => instance[prop]
 * */
const groupControllersByPath = () => {
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

const validateQueryAndParam = () => {
  const _instance = ApiParametersExplorer as any;

  const _prop = 'exploreApiParametersMetadata';
  const _super = _instance[_prop];
  const _accessor = new ParameterMetadataAccessor();
  _instance[_prop] = (
    schemas: any,
    instance: any,
    prototype: any,
    method: any,
  ) => {
    // add param and query validation to swagger
    Object.values(_accessor.explore(instance, prototype, method) || {})
      .filter((obj) => obj.in !== 'body')
      .map((metadata): ParameterObject[] => {
        const schemaObject = getSchemaObject(metadata, method);
        if (!schemaObject) return [];

        const required = new Set(schemaObject.required);
        return Object.entries(
          schemaObject.properties as { [_: string]: SchemaObject },
        ).map(([name, { type }]) => ({
          name,
          type,
          in: metadata.in as ParameterLocation,
          required: required.has(name),
        }));
      })
      .filter((params) => params)
      .forEach((params) => {
        Reflect.defineMetadata(DECORATORS.API_PARAMETERS, params, method);
      });
    return _super(schemas, instance, prototype, method);
  };
};
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
