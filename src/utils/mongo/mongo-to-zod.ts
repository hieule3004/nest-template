import * as mongoose from 'mongoose';
import { z } from 'zod';
import { TypedMongoose } from './types';

type Schema<T> = {
  instance:
    | 'String'
    | 'Number'
    | 'Boolean'
    | 'Date'
    | 'ObjectID'
    | 'Mixed'
    | 'Array';
  options: mongoose.SchemaTypeOptions<T>;
  paths: Record<string, Schema<any>>;
  subpaths: Record<string, Schema<any>>;
  nested: Record<string, boolean>;
  enumValues?: string[];
  isRequired?: boolean;
  defaultValue?: any;
  $isMongooseArray?: true;
} & (
  | {
      $isMongooseDocumentArray: true;
      schema: Schema<any>;
    }
  | {
      $isMongooseDocumentArray?: false;
    }
);

function _m2zBase<T>(schema: Schema<T>) {
  const {
    instance: type,
    enumValues,
    isRequired,
    defaultValue,
  } = schema as any;
  let zodSchema;

  // simple handle complex types
  if (type === 'Mixed') zodSchema = z.any();
  else if (type === 'ObjectID') zodSchema = z.any();
  // zodSchema = z.preprocess((o: any) => o.toString(), z.string().regex(/^[0-9a-fA-F]{24}$/));
  // handle primitive types
  else if (type === 'String')
    if (enumValues) zodSchema = z.enum(enumValues);
    else zodSchema = z.string();
  else if (type === 'Number') zodSchema = z.number();
  else if (type === 'Boolean') zodSchema = z.boolean();
  else if (type === 'Date') zodSchema = z.date();
  // not handle all Schema.Types
  else throw new Error(`Type out of scope: ${type}`);

  // handle required value
  if (!isRequired) zodSchema = zodSchema.optional();

  // handle default value
  if (defaultValue !== undefined) {
    if (defaultValue === null) zodSchema = zodSchema.nullable();
    zodSchema = (zodSchema as z.ZodTypeAny).default(defaultValue);
  }

  return zodSchema;
}

function _m2zRec<T>(schema: Schema<T>) {
  const { paths, subpaths, nested } = schema;

  const properties = Object.entries(paths).reduce((properties, [path, obj]) => {
    // paths are dot-concatenated string
    const ps = path.split('.');
    // get key to be updated
    let key: any = ps.pop();
    // `Mixed` type schema is interpreted as object but should be handled as base case
    if (obj.instance === 'Mixed') key = ps.pop();

    // get object to be updated
    const props = ps.reduce((target: any, key) => {
      if (!target[key]) target[key] = {};
      return target[key];
    }, properties);

    let level = 0;
    // find nested level of items
    if (obj.$isMongooseDocumentArray) level++;
    else {
      for (let sub = path + '.$'; sub in subpaths; sub += '.$') {
        obj = subpaths[sub];
        level++;
        // stop if item type is primitive or document array
        if (obj.$isMongooseDocumentArray || !obj.$isMongooseArray) break;
      }
    }
    // document array contains inner schema to be called recursively, otherwise handle primitive type
    let valueSchema = obj.$isMongooseDocumentArray
      ? _m2zRec(obj.schema)
      : _m2zBase(obj);
    for (let i = 0; i < level; i++)
      valueSchema = valueSchema.array().optional() as z.ZodTypeAny;

    // handle nested object type
    props[key] = valueSchema;
    return properties;
  }, {});

  const shape = Object.keys(nested).reduce((properties, path) => {
    const ps = path.split('.');
    const key: any = ps.pop();
    const props = ps.reduce((target: any, key) => target[key], properties);
    // create object from shape
    props[key] = z.object(props[key]).optional();
    return properties;
  }, properties);

  return z.object(shape);
}

/** Convert mongoose schema to zod validator */
const mongooseToZod = <T>(schema: mongoose.Schema<T>) =>
  _m2zRec(schema as unknown as Schema<T>) as unknown as z.ZodType<
    TypedMongoose.infer<T>
  >;

export { mongooseToZod };
