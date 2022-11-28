import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerDocumentOptions,
} from '@nestjs/swagger';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { isZodDto, zodToOpenAPI } from '../../common/zod';
import { currentBranch, repoUrl } from '../../common/git/git-info';
import { DotenvDto, getEnv } from '../dotenv';

export class SwaggerConfig {
  get apiPrefix() {
    return getEnv('API_PREFIX');
  }

  private get license() {
    return `${repoUrl}/blob/${currentBranch}/LICENSE.md`;
  }

  /** Document Builder */
  get documentBuilder() {
    return new DocumentBuilder()
      .addServer(this.apiPrefix)
      .addBasicAuth()
      .addBearerAuth()
      .setTitle(getEnv('npm_package_name'))
      .setDescription(getEnv('npm_package_description'))
      .setVersion(getEnv('npm_package_version'))
      .setLicense(getEnv('npm_package_license'), this.license);
  }

  /** Document options for {@link import('SwaggerModule').createDocument} */
  get documentOptions(): SwaggerDocumentOptions {
    return {
      extraModels: [DotenvDto],
      deepScanRoutes: true,
      ignoreGlobalPrefix: true,
      operationIdFactory: (_controllerKey, methodKey) => methodKey,
    };
  }

  /** Custom options for {@link import('SwaggerModule').setup} */
  get customOptions(): SwaggerCustomOptions {
    return {
      // https://github.com/swagger-api/swagger-ui/blob/master/docs/usage/configuration.md
      swaggerOptions: {
        docExpansion: 'none',
        tryItOutEnabled: true,
      },
    };
  }
}

/** Swagger scheme - AuthGuard type map,
 * keys should match {@link SwaggerConfig.documentBuilder} auth options */
export const getAuthSchemes = (): Record<string, string[]> => ({
  basic: ['local'],
  bearer: [],
});

/** Create SchemaObject for {@external import('SwaggerObjectFactory').exploreModelSchema}
 * @param metadata: Swagger metadata to be converted to SchemaObject
 * @param method: API endpoint object
 * */
export function mapToSchemaObject(
  metadata: any,
  method?: any,
): { refName?: string; schemaObject: SchemaObject } | undefined {
  // Zod to Swagger
  if (isZodDto(metadata.type))
    return {
      refName: metadata.type?.name,
      schemaObject: zodToOpenAPI(metadata.type.schema),
    };

  // basic raw type
  let type: any = metadata.type;
  if (typeof type === 'function') type = type.length ? typeof type() : 'object';
  if (type) {
    const schemaObject: any = { type };
    if (type === 'object') schemaObject.properties = {};
    return { refName: type.name, schemaObject };
  }

  return undefined;
}
