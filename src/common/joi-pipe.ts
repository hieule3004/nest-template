import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';
import { NumberSchema, ObjectSchema } from 'joi';

const DEFAULT_SKIP = 0;
const DEFAULT_LIMIT = 100;

export class JoiValidationPipe implements PipeTransform {
  constructor(
    private querySchema?: ObjectSchema,
    private paramSchema?: NumberSchema,
    private bodySchema?: ObjectSchema,
    private customSchema?: ObjectSchema,
  ) {}

  transform(value: any, metadata: ArgumentMetadata) {
    let errors = {};
    const { type } = metadata;

    switch (type) {
      case 'query':
        errors = this.validateError(this.querySchema, value, type, errors);
        break;
      case 'param':
        errors = this.validateError(this.paramSchema, value, type, errors);
        break;
      case 'body':
        errors = this.validateError(this.bodySchema, value, type, errors);
        break;
      case 'custom':
        errors = this.validateError(this.customSchema, value, type, errors);
        break;
    }

    if (Object.keys(errors).length > 0) {
      throw new BadRequestException(errors);
    }

    if (type === 'query') {
      return Object.assign(value, {
        skip: parseInt(value.skip || DEFAULT_SKIP, 10),
        limit: parseInt(value.limit || DEFAULT_LIMIT, 10),
      });
    }

    return value;
  }

  private validateError(schema: any, value: any, type: string, errors: any) {
    if (schema) {
      const { error } = schema.validate(value);

      if (error) {
        return Object.assign(errors, { [type]: error });
      }
    }

    return errors;
  }
}
