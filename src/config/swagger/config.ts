import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerDocumentOptions,
} from '@nestjs/swagger';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { zodToOpenAPI } from 'nestjs-zod';
import { getConfigService } from '../dotenv';

export class SwaggerConfig {
  private readonly env: ConfigService;

  constructor(app: INestApplication) {
    this.env = getConfigService(app);
  }

  get apiPrefix() {
    return this.env.get<any>('API_PREFIX') as string;
  }

  /** Document Builder */
  get documentBuilder() {
    return new DocumentBuilder()
      .addServer(this.apiPrefix)
      .addBasicAuth()
      .addBearerAuth()
      .setTitle(this.env.get<any>('npm_package_name'))
      .setDescription(this.env.get<any>('npm_package_description'))
      .setVersion(this.env.get<any>('npm_package_version'));
  }

  /** Document options for {@link import('SwaggerModule').createDocument} */
  get documentOptions(): SwaggerDocumentOptions {
    return {
      deepScanRoutes: true,
      ignoreGlobalPrefix: true,
      operationIdFactory: (_controllerKey, methodKey) => methodKey,
    };
  }

  /** Custom options for {@link import('SwaggerModule').setup} */
  get customOptions(): SwaggerCustomOptions {
    return {
      swaggerOptions: {
        docExpansion: 'none',
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
  if (metadata.type?.isZodDto)
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
