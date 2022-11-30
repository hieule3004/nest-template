import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import deepmerge from 'deepmerge';
import * as zod from 'zod';
import { ZodFirstPartyTypeKind, ZodTypeAny } from 'zod';

export const zodToOpenAPI = (zodType: ZodTypeAny): SchemaObject => {
  const object: SchemaObject = {};
  if (zodType.description) object.description = zodType.description;
  mapper[zodType.constructor.name as ZodTypeKey]?.(zodType as any, object);
  return object;
};

type ZodTypeKey = keyof typeof ZodFirstPartyTypeKind;
type ZodTypeInstance<K extends ZodTypeKey> = InstanceType<typeof zod[K]>;
const mapper: {
  [K in ZodTypeKey]: (
    zodType: ZodTypeInstance<K>,
    object: SchemaObject,
  ) => void;
} = {
  ZodString: (zodType, object) => {
    const { checks } = zodType._def;
    object.type = 'string';

    for (const check of checks) {
      if (check.kind === 'min') {
        object.minLength = check.value;
      } else if (check.kind === 'max') {
        object.maxLength = check.value;
      } else if (check.kind === 'email') {
        object.format = 'email';
      } else if (check.kind === 'url') {
        object.format = 'uri';
      } else if (check.kind === 'uuid') {
        object.format = 'uuid';
      } else if (check.kind === 'cuid') {
        object.format = 'cuid';
      } else if (check.kind === 'regex') {
        object.pattern = check.regex.source;
      } else if (check.kind === 'startsWith') {
        object.pattern = `^${check.value}`;
      } else if (check.kind === 'endsWith') {
        object.pattern = `${check.value}$`;
      }
      // do nothing for `trim`
    }
  },

  ZodNumber: (zodType, object) => {
    const { checks } = zodType._def;
    object.type = 'number';

    for (const check of checks) {
      if (check.kind === 'int') {
        object.type = 'integer';
      } else if (check.kind === 'min') {
        object.minimum = check.value;
        object.exclusiveMinimum = !check.inclusive;
      } else if (check.kind === 'max') {
        object.maximum = check.value;
        object.exclusiveMaximum = !check.inclusive;
      } else if (check.kind === 'multipleOf') {
        object.multipleOf = check.value;
      }
    }
  },

  ZodNaN: (zodType, object) => {
    object.type = 'number';
    object.format = 'double';
  },

  ZodBigInt: (zodType, object) => {
    object.type = 'integer';
    object.format = 'int64';
  },

  ZodBoolean: (zodType, object) => {
    object.type = 'boolean';
  },

  ZodDate: (zodType, object) => {
    object.type = 'string';
    object.format = 'date-time';
  },

  ZodUndefined: () => undefined,

  ZodNull: () => undefined,

  ZodAny: (zodType, object) => {
    object.type = 'object';
    object.properties = {};
  },

  ZodUnknown: () => undefined,

  ZodNever: () => undefined,

  ZodVoid: () => undefined,

  ZodArray: (zodType, object) => {
    const { minLength, maxLength, type } = zodType._def;
    object.type = 'array';
    if (minLength) object.minItems = minLength.value;
    if (maxLength) object.maxItems = maxLength.value;
    object.items = zodToOpenAPI(type);
  },

  ZodObject: (zodType, object) => {
    const { shape } = zodType._def;
    object.type = 'object';

    object.properties = {};
    object.required = [];

    for (const [key, schema] of Object.entries<ZodTypeAny>(shape())) {
      object.properties[key] = zodToOpenAPI(schema);
      const optionalTypes = ['ZodOptional', 'ZodDefault'];
      const isOptional = optionalTypes.includes(schema.constructor.name);
      if (!isOptional) object.required.push(key);
    }

    if (object.required.length === 0) {
      delete object.required;
    }
  },

  ZodUnion: (zodType, object) => {
    const { options } = zodType._def;
    object.oneOf = options.map(zodToOpenAPI);
  },

  ZodDiscriminatedUnion: (zodType, object) => {
    const { options } = zodType._def;
    object.oneOf = [];
    for (const schema of options.values()) {
      object.oneOf.push(zodToOpenAPI(schema));
    }
  },

  ZodIntersection: (zodType, object) => {
    const { left, right } = zodType._def;
    const merged = deepmerge(
      zodToOpenAPI(left),
      zodToOpenAPI(right),
      deepMergeOptions,
    );
    Object.assign(object, merged);
  },

  ZodTuple: (zodType, object) => {
    const { items } = zodType._def;
    object.type = 'array';
    object.items = { oneOf: items.map(zodToOpenAPI) };
  },

  ZodRecord: (zodType, object) => {
    const { valueType } = zodType._def;
    object.type = 'object';
    object.additionalProperties = zodToOpenAPI(valueType);
  },

  ZodMap: (zodType, object) => {
    const { valueType } = zodType._def;
    object.type = 'object';
    object.additionalProperties = zodToOpenAPI(valueType);
  },

  ZodSet: (zodType, object) => {
    const { valueType, minSize, maxSize } = zodType._def;
    object.type = 'array';
    if (minSize) object.minItems = minSize.value;
    if (maxSize) object.maxItems = maxSize.value;
    object.items = zodToOpenAPI(valueType);
    object.uniqueItems = true;
  },

  ZodFunction: () => undefined,

  ZodLazy: (zodType, object) => {
    const { getter } = zodType._def;
    Object.assign(object, zodToOpenAPI(getter()));
  },

  ZodLiteral: (zodType, object) => {
    const { value } = zodType._def;

    if (typeof value === 'string') {
      object.type = 'string';
      object.enum = [value];
    }

    if (typeof value === 'number') {
      object.type = 'number';
      object.minimum = value;
      object.maximum = value;
    }

    if (typeof value === 'boolean') {
      // currently there is no way to completely describe boolean literal
      object.type = 'boolean';
    }
  },

  ZodEnum: (zodType, object) => {
    const { values } = zodType._def;
    object.type = 'string';
    object.enum = values;
  },

  ZodEffects: (zodType, object) => {
    const { schema } = zodType._def;
    Object.assign(object, zodToOpenAPI(schema));
  },

  ZodNativeEnum: (zodType, object) => {
    const { values } = zodType._def;
    // this only supports enums with string literal values
    object.type = 'string';
    object.enum = Object.values(values);
  },

  ZodOptional: (zodType, object) => {
    const { innerType } = zodType._def;
    Object.assign(object, zodToOpenAPI(innerType));
  },

  ZodNullable: (zodType, object) => {
    const { innerType } = zodType._def;
    Object.assign(object, zodToOpenAPI(innerType));
    object.nullable = true;
  },

  ZodDefault: (zodType, object) => {
    const { defaultValue, innerType } = zodType._def;
    Object.assign(object, zodToOpenAPI(innerType));
    object.default = defaultValue();
  },

  ZodPromise: (zodType, object) => {
    const { type } = zodType._def;
    Object.assign(object, zodToOpenAPI(type));
  },

  ZodBranded: (zodType, object) => {
    const { type } = zodType._def;
    Object.assign(object, zodToOpenAPI(type));
  },
};

// deepmerge options: unique array
const deepMergeOptions: deepmerge.Options = {
  arrayMerge(target, source, options: any) {
    return source
      .reduce((acc: typeof target, element) => {
        if (!target.includes(element)) acc.push(element);
        return acc;
      }, target)
      .map((element) =>
        options.cloneUnlessOtherwiseSpecified(element, options),
      );
  },
};
