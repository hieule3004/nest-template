import { INestApplication } from '@nestjs/common';
import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import * as Passport from '@nestjs/passport/dist/auth.guard';
import { SwaggerModule } from '@nestjs/swagger';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import * as ApiParametersExplorer from '@nestjs/swagger/dist/explorers/api-parameters.explorer';
import * as ApiResponseExplorer from '@nestjs/swagger/dist/explorers/api-response.explorer';
import * as ApiSecurityExplorer from '@nestjs/swagger/dist/explorers/api-security.explorer';
import * as ApiUseTagsExplorer from '@nestjs/swagger/dist/explorers/api-use-tags.explorer';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { ParameterMetadataAccessor } from '@nestjs/swagger/dist/services/parameter-metadata-accessor';
import { SchemaObjectFactory } from '@nestjs/swagger/dist/services/schema-object-factory';
import { extendMetadata } from '@nestjs/swagger/dist/utils/extend-metadata.util';
import { isBodyParameter } from '@nestjs/swagger/dist/utils/is-body-parameter.util';
import * as fs from 'fs';
import {
  getApiPrefix,
  getAuthSchemes,
  getDocumentBuilder,
  mapToSchemaObject,
} from './config';

/** Setup swagger */
function setupSwagger(app: INestApplication) {
  // auto apply decorators patches
  groupController();
  validateAuth();
  validateEndpoint();

  const config = getDocumentBuilder().build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
    ignoreGlobalPrefix: true,
    operationIdFactory: (_controllerKey, methodKey) => methodKey,
  });

  fs.writeFile('swagger.json', JSON.stringify(document, null, 2), () => null);

  SwaggerModule.setup(getApiPrefix(), app, document);
}

/**
 * Group endpoint by controller path. As method are initialised before class,
 * register callbacks to add ApiTags to each endpoint.
 *
 * Alternative: SwaggerExplorer.exploreGlobalMetadata; less code but more hacky
 * instance[prop] = prototype[prop]; prototype[prop] = () => instance[prop]
 * */
const groupController = () => {
  const KEY = '__group_path_swagger__';

  const _instance: any = ApiUseTagsExplorer;

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

//---- Authentication ----//

const AUTH_METADATA = '__swagger_auth_scheme__';

// reverse lookup map for auths
const authMap = Object.entries(getAuthSchemes()).reduce(
  (target, [scheme, types]) =>
    types.reduce((obj, type) => {
      obj[type] = scheme;
      return obj;
    }, target),
  {} as { [_: string]: string },
);

const interceptGuard = () => {
  const _instance: any = Passport;

  const _prop = 'AuthGuard';
  const _super = _instance[_prop];
  _instance[_prop] = (type: any) => {
    const guard = _super(type);
    // add auth scheme metadata
    Reflect.defineMetadata(AUTH_METADATA, authMap[type], guard);
    return guard;
  };
  // rerun all strategies to add type, fast due to memoize
  Object.keys(authMap).forEach(_instance[_prop]);
};

/**
 * Add auth method based on AuthGuard
 * */
const validateAuth = () => {
  interceptGuard();
  // add security metadata to swagger
  const addAuthMetadata = (metatype: any) => {
    const ss: string[] = (
      Reflect.getMetadata(GUARDS_METADATA, metatype) || []
    ).map((guard: any) => Reflect.getMetadata(AUTH_METADATA, guard));
    const metadata = ss
      .filter((scheme, i: number) => scheme && ss.indexOf(scheme) === i)
      .map((scheme) => ({ [scheme]: [] }));
    appendMetadata(DECORATORS.API_SECURITY, metatype, ...metadata);
  };

  const _instance: any = ApiSecurityExplorer;

  const _propG = 'exploreGlobalApiSecurityMetadata';
  const _superG = _instance[_propG];
  _instance[_propG] = (metatype: any) => {
    addAuthMetadata(metatype);
    return _superG(metatype);
  };

  const _propL = 'exploreApiSecurityMetadata';
  const _superL = _instance[_propL];
  _instance[_propL] = (instance: any, prototype: any, method: any) => {
    addAuthMetadata(method);
    return _superL(instance, prototype, method);
  };
};

//---- Request ----//

/**
 * Add request path, query object and body schema
 * Note: For @nestjs/swagger v5 or higher, remove schemaRefsStack
 * */
const validateRequest = () => {
  const _accessor = new ParameterMetadataAccessor();

  const _instance: any = ApiParametersExplorer;

  const _prop = 'exploreApiParametersMetadata';
  const _super = _instance[_prop];
  _instance[_prop] = (
    schemas: any,
    instance: any,
    prototype: any,
    method: any,
  ) => {
    Object.values(_accessor.explore(instance, prototype, method) || {}).forEach(
      (metadata) => {
        const sObj = mapToSchemaObject(metadata, method);
        if (!sObj) return;
        const { refName, schemaObject } = sObj;

        if (isBodyParameter(metadata)) {
          // add body schema to swagger
          if (refName) schemas[refName] = schemaObject;
          else
            appendMetadata(DECORATORS.API_PARAMETERS, method, {
              schema: schemaObject,
              type: schemaObject.type,
              in: metadata.in,
              required: true,
            });
        } else {
          // add path and query validation to swagger
          const required = new Set(schemaObject.required);
          const params: any[] = Object.entries(
            schemaObject.properties as { [_: string]: SchemaObject },
          ).map(([name, { type }]) => ({
            name,
            type,
            in: metadata.in,
            required: required.has(name),
          }));
          appendMetadata(DECORATORS.API_PARAMETERS, method, ...params);
        }
      },
    );
    return _super(schemas, instance, prototype, method);
  };
};

//---- Response ----//

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
    const _resp = Object.entries(resp).reduce(
      (target: any, [key, metadata]) => {
        const sObj = mapToSchemaObject(metadata, method);
        if (!sObj) return;
        const { refName, schemaObject } = sObj;
        // add response schema to swagger
        if (refName) schemas[refName] = schemaObject;
        else target[key] = { schema: schemaObject };
        return target;
      },
      resp,
    );
    if (resp) Reflect.defineMetadata(DECORATORS.API_RESPONSE, _resp, method);
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

//---- Utils function ----//

function appendMetadata(key: string, metatype: any, ...metadata: any[]) {
  const newMetadata = extendMetadata(metadata, key, metatype);
  Reflect.defineMetadata(key, newMetadata, metatype);
}

export { setupSwagger };
