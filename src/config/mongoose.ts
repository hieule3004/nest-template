import { Model } from 'mongoose';
import { ModelDefinition } from '@nestjs/mongoose';

export const modelDef = <T>(m: Model<T>): ModelDefinition => {
  return { name: m.name, schema: m.schema };
};
