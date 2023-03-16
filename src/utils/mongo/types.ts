import mongoose from 'mongoose';

type Json =
  | null
  | string
  | number
  | boolean
  | Date
  // eslint-disable-next-line @typescript-eslint/ban-types
  | Function
  | Array<Json>
  | { [prop: string]: Json };

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace TypedMongoose {
  type Required<R, T> = R extends true ? T : T | undefined;

  // Type Definition

  type PrimitiveType<T> = T extends mongoose.StringSchemaDefinition
    ? { $type: string }
    : T extends mongoose.NumberSchemaDefinition
    ? { $type: number }
    : T extends mongoose.BooleanSchemaDefinition
    ? { $type: boolean }
    : T extends mongoose.DateSchemaDefinition
    ? { $type: Date }
    : T extends mongoose.ObjectIdSchemaDefinition
    ? { $type: mongoose.ObjectId }
    : never;

  type MixedType<T> = T extends { select: false }
    ? { $type: never }
    : T extends { type: infer S; required?: infer R }
    ? { $type: Required<R, PrimitiveType<S>['$type']> }
    : PrimitiveType<T> extends never
    ? never
    : { $type: Required<undefined, PrimitiveType<T>['$type']> };

  type ArrayType<T> = T extends Array<infer S>
    ? Array<ArrayType<S>>
    : ObjectType<T>;

  type ObjectType<T> = MixedType<T> extends never
    ? { [K in keyof T]: ArrayType<T[K]> }
    : MixedType<T>['$type'];

  export { ObjectType as infer };
}

const TypedMongoose = {
  Schema: <
    Key extends PropertyKey,
    Value extends Json,
    T extends Record<Key, Value>,
  >(
    definition: T,
  ) => new mongoose.Schema(definition as any) as mongoose.Schema<T>,
};

export { TypedMongoose };
