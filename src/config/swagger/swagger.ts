import { INestApplication } from '@nestjs/common';
import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import * as Passport from '@nestjs/passport/dist/auth.guard';
import { SwaggerModule } from '@nestjs/swagger';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import * as ApiParametersExplorer from '@nestjs/swagger/dist/explorers/api-parameters.explorer';
import * as ApiResponseExplorer from '@nestjs/swagger/dist/explorers/api-response.explorer';
import * as ApiSecurityExplorer from '@nestjs/swagger/dist/explorers/api-security.explorer';
import * as ApiUseTagsExplorer from '@nestjs/swagger/dist/explorers/api-use-tags.explorer';
import * as GetSchemaPath from '@nestjs/swagger/dist/utils/get-schema-path.util';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { ParameterMetadataAccessor } from '@nestjs/swagger/dist/services/parameter-metadata-accessor';
import { SchemaObjectFactory } from '@nestjs/swagger/dist/services/schema-object-factory';
import * as fs from 'fs';
import { getAuthSchemes, mapToSchemaObject, SwaggerConfig } from './config';

/** Setup swagger */
function setupSwagger(app: INestApplication) {
  // auto apply decorators patches
  groupController();
  validateAuth();
  validateEndpoint();

  const sc = new SwaggerConfig(app);

  const config = sc.getDocumentBuilder().build();
  const documentOptions = sc.getDocumentOptions();
  const document = SwaggerModule.createDocument(app, config, documentOptions);

  const jsonString = JSON.stringify(document, null, 2);
  fs.writeFile('swagger.json', jsonString, () => null);

  const customOptions = sc.getCustomOptions();
  SwaggerModule.setup(sc.getApiPrefix(), app, document, customOptions);
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

  // local override, register callbacks
  const _propL = 'exploreApiTagsMetadata';
  const _superL = _instance[_propL];
  _instance[_propL] = (instance: any, prototype: any, method: any) => {
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
    return _superL(instance, prototype, method);
  };

  // global override, execute callbacks
  const _propG = 'exploreGlobalApiTagsMetadata';
  const _superG = _instance[_propG];
  _instance[_propG] = (metatype: any) => {
    const cbs: any[] = Reflect.getMetadata(KEY, metatype.prototype);
    if (cbs) {
      for (const cb of cbs) cb(metatype);
      Reflect.deleteMetadata(KEY, metatype.prototype);
    }
    return _superG(metatype);
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
  // setup auth metadata to be processed
  interceptGuard();

  // add security metadata to swagger
  const updated: Record<'class' | 'method', Record<string, string[]>> = {
    class: {},
    method: {},
  };
  const updateAuthMetadata = (metatype: any, schemes: string[] = []) => {
    const cache = updated[metatype.prototype ? 'class' : 'method'];
    if (metatype.name in cache) return;
    const newSchemes = (Reflect.getMetadata(GUARDS_METADATA, metatype) || [])
      .map((guard: any) => Reflect.getMetadata(AUTH_METADATA, guard))
      .filter((s: string) => s && !schemes.includes(s)) as string[];
    const metadata = newSchemes.map((scheme) => ({ [scheme]: [] }));
    appendMetadata(DECORATORS.API_SECURITY, metatype, metadata);
    cache[metatype.name] = newSchemes;
  };

  const _instance: any = ApiSecurityExplorer;

  const _propL = 'exploreApiSecurityMetadata';
  const _superL = _instance[_propL];
  _instance[_propL] = (instance: any, prototype: any, method: any) => {
    const schemes = updated.class[instance.constructor.name] || [];
    updateAuthMetadata(method, schemes);
    return _superL(instance, prototype, method);
  };

  // global override, execute callback
  const _propG = 'exploreGlobalApiSecurityMetadata';
  const _superG = _instance[_propG];
  _instance[_propG] = (metatype: any) => {
    updateAuthMetadata(metatype);
    return _superG(metatype);
  };
};

//---- Request ----//

/** Fix ref path resolving null object */
const interceptRefPathResolver = () => {
  const _instance: any = GetSchemaPath;
  const _prop = 'getSchemaPath';
  const _super = _instance[_prop];
  _instance[_prop] = function (model: any) {
    return model ? _super(model) : undefined;
  };
};

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
    const params = Object.values(
      _accessor.explore(instance, prototype, method) || {},
    ).reduce((target: any[], metadata) => {
      const sObj = mapToSchemaObject(metadata, method);
      if (!sObj) return target;
      const { refName, schemaObject } = sObj;

      const isBody = metadata.in === 'body';
      if (isBody && refName) {
        // add body ref to swagger
        schemas[refName] = schemaObject;
        return target;
      } else if (!isBody && schemaObject.type === 'object') {
        // add header, param, query as key-value
        const required = new Set(schemaObject.required);
        const arr = Object.entries(
          schemaObject.properties as { [_: string]: SchemaObject },
        ).map(([name, { type }]) => ({
          name,
          type,
          in: metadata.in,
          required: required.has(name),
        }));
        return target.concat(arr);
      } else {
        // add non-object request parameter
        const obj: any = {
          type: schemaObject.type,
          schema: schemaObject,
          in: metadata.in,
          required: metadata.required,
        };
        if (metadata.name) obj.name = metadata.name;
        target.push(obj);
        return target;
      }
    }, []);
    appendMetadata(DECORATORS.API_PARAMETERS, method, params);
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
      (target: any, [key, metadata]: any[]) => {
        const sObj = mapToSchemaObject(metadata, method);
        if (!sObj) return target;
        const { refName, schemaObject } = sObj;
        // add response schema to swagger
        if (refName) schemas[refName] = schemaObject;
        else
          target[key] = {
            schema: schemaObject,
            isArray: metadata.isArray,
            description: metadata.description,
          };
        return target;
      },
      resp,
    );
    if (resp) Reflect.defineMetadata(DECORATORS.API_RESPONSE, _resp, method);
    return _super(schemas, instance, prototype, method);
  };
};

const validateEndpoint = () => {
  interceptRefPathResolver();
  validateRequest();
  validateResponse();

  const _prototype: any = SchemaObjectFactory.prototype;
  const _prop = 'exploreModelSchema';
  // remove default schema creation, handled manually above
  _prototype[_prop] = (type: any, schemas: any) => {
    if (_prototype.isLazyTypeFunc(type)) type = type();
    if (type.name in schemas) return type.name;

    const sObj = mapToSchemaObject({ type }, () => null);
    if (!sObj) return type.name;

    const { refName, schemaObject } = sObj;
    if (refName) schemas[refName] = schemaObject;
    return refName;
  };
};

//---- Utils function ----//

function appendMetadata(key: string, metatype: any, metadata: any[]) {
  const existingMetadata = Reflect.getMetadata(key, metatype);
  const joinedMetadata = existingMetadata
    ? existingMetadata.concat(metadata)
    : metadata;
  Reflect.defineMetadata(key, joinedMetadata, metatype);
}

export { setupSwagger };
