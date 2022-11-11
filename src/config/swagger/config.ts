import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerDocumentOptions,
} from '@nestjs/swagger';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { zodToOpenAPI } from 'nestjs-zod';

const getApiPrefix = () => process.env.API_PREFIX || '/api';

/** Document Builder */
const getDocumentBuilder = () =>
  new DocumentBuilder()
    .addServer(getApiPrefix())
    .addBasicAuth()
    .addBearerAuth()
    .setTitle(process.env.npm_package_name || '')
    .setDescription(process.env.npm_package_description || '')
    .setVersion(process.env.npm_package_version || '');

/** Swagger scheme - AuthGuard type map,
 * keys should match {@link getDocumentBuilder} auth options */
const getAuthSchemes = (): Record<string, string[]> => ({
  basic: ['local'],
  bearer: [],
});

/** Document options for {@link import('SwaggerModule').createDocument} */
const getDocumentOptions = (): SwaggerDocumentOptions => ({
  deepScanRoutes: true,
  ignoreGlobalPrefix: true,
  operationIdFactory: (_controllerKey, methodKey) => methodKey,
});

/** Custom options for {@link import('SwaggerModule').setup} */
const getCustomOptions = (): SwaggerCustomOptions => ({
  swaggerOptions: {
    docExpansion: 'none',
  },
});

/** Create SchemaObject for {@external import('SwaggerObjectFactory').exploreModelSchema}
 * @param metadata: Swagger metadata to be converted to SchemaObject
 * @param method: API endpoint object
 * */
function mapToSchemaObject(
  metadata: any,
  method?: any,
): { refName?: string; schemaObject: SchemaObject } | undefined {
  // Zod to Swagger
  if (metadata.type?.isZodDto)
    return {
      refName: metadata.type?.name,
      schemaObject: zodToOpenAPI(metadata.type.schema),
    };

  /** @example
  // Joi to Swagger
  const location = metadata.in === 'path' ? 'param' : metadata.in ?? 'custom';
  const pipes = Reflect.getMetadata(PIPES_METADATA, method);
  const joiPipe = pipes?.find((p: any) => p instanceof JoiValidationPipe);
  const schema = joiPipe?.[`${location}Schema`];
  if (schema) return { schemaObject: joiToSwagger(schema).swagger };
   */

  // basic raw type
  let type: any = metadata.type;
  if (typeof type === 'function') type = type.length ? typeof type() : 'object';
  if (!type) return undefined;

  const schemaObject: any = { type };
  if (type === 'object') schemaObject.properties = {};
  return { refName: type.name, schemaObject };
}

export {
  getApiPrefix,
  getCustomOptions,
  getDocumentBuilder,
  getDocumentOptions,
  getAuthSchemes,
  mapToSchemaObject,
};
