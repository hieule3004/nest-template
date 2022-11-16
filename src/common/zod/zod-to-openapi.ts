import { Type } from '@nestjs/common';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import * as deepMerge from 'deepmerge';
import {
  ZodArray,
  ZodBigInt,
  ZodBoolean,
  ZodBranded,
  ZodDefault,
  ZodDiscriminatedUnion,
  ZodEnum,
  ZodIntersection,
  ZodLiteral,
  ZodNativeEnum,
  ZodNullable,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodRecord,
  ZodSet,
  ZodString,
  ZodTransformer,
  ZodTuple,
  ZodTypeAny,
  ZodUnion,
} from 'zod';

export function is<T extends Type<ZodTypeAny>>(
  input: ZodTypeAny,
  factory: T,
): input is InstanceType<T> {
  return factory.name === input.constructor.name;
}
export function zodToOpenAPI(zodType: ZodTypeAny) {
  const object: SchemaObject = {};

  if (zodType.description) {
    object.description = zodType.description;
  }

  if (is(zodType, ZodString)) {
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
    }
  }

  if (is(zodType, ZodBoolean)) {
    object.type = 'boolean';
  }

  if (is(zodType, ZodNumber)) {
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
  }

  if (is(zodType, ZodBigInt)) {
    object.type = 'integer';
    object.format = 'int64';
  }

  if (is(zodType, ZodArray)) {
    const { minLength, maxLength, type } = zodType._def;
    object.type = 'array';
    if (minLength) object.minItems = minLength.value;
    if (maxLength) object.maxItems = maxLength.value;
    object.items = zodToOpenAPI(type);
  }

  if (is(zodType, ZodTuple)) {
    const { items } = zodType._def;
    object.type = 'array';
    object.items = { oneOf: items.map(zodToOpenAPI) };
  }

  if (is(zodType, ZodSet)) {
    const { valueType, minSize, maxSize } = zodType._def;
    object.type = 'array';
    if (minSize) object.minItems = minSize.value;
    if (maxSize) object.maxItems = maxSize.value;
    object.items = zodToOpenAPI(valueType);
    object.uniqueItems = true;
  }

  if (is(zodType, ZodUnion)) {
    const { options } = zodType._def;
    object.oneOf = options.map(zodToOpenAPI);
  }

  if (is(zodType, ZodDiscriminatedUnion)) {
    const { options } = zodType._def;
    object.oneOf = [];
    for (const schema of options.values()) {
      object.oneOf.push(zodToOpenAPI(schema));
    }
  }

  if (is(zodType, ZodLiteral)) {
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
  }

  if (is(zodType, ZodEnum)) {
    const { values } = zodType._def;
    object.type = 'string';
    object.enum = values;
  }

  if (is(zodType, ZodNativeEnum)) {
    const { values } = zodType._def;
    // this only supports enums with string literal values
    object.type = 'string';
    object.enum = Object.values(values);
  }

  if (is(zodType, ZodTransformer)) {
    const { schema } = zodType._def;
    Object.assign(object, zodToOpenAPI(schema));
  }

  if (is(zodType, ZodNullable)) {
    const { innerType } = zodType._def;
    Object.assign(object, zodToOpenAPI(innerType));
    object.nullable = true;
  }

  if (is(zodType, ZodOptional)) {
    const { innerType } = zodType._def;
    Object.assign(object, zodToOpenAPI(innerType));
  }

  if (is(zodType, ZodDefault)) {
    const { defaultValue, innerType } = zodType._def;
    Object.assign(object, zodToOpenAPI(innerType));
    object.default = defaultValue();
  }

  if (is(zodType, ZodObject)) {
    const { shape } = zodType._def;
    object.type = 'object';

    object.properties = {};
    object.required = [];

    for (const [key, schema] of Object.entries<ZodTypeAny>(shape())) {
      object.properties[key] = zodToOpenAPI(schema);
      const optionalTypes = [ZodOptional.name, ZodDefault.name];
      const isOptional = optionalTypes.includes(schema.constructor.name);
      if (!isOptional) object.required.push(key);
    }

    if (object.required.length === 0) {
      delete object.required;
    }
  }

  if (is(zodType, ZodRecord)) {
    const { valueType } = zodType._def;
    object.type = 'object';
    object.additionalProperties = zodToOpenAPI(valueType);
  }

  if (is(zodType, ZodIntersection)) {
    const { left, right } = zodType._def;
    const merged = deepMerge(zodToOpenAPI(left), zodToOpenAPI(right), options);
    Object.assign(object, merged);
  }

  if (is(zodType, ZodBranded)) {
    const { type } = zodType._def;
    Object.assign(object, zodToOpenAPI(type));
  }

  return object;
}

// deepmerge options: unique array
const options: deepMerge.Options = {
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
