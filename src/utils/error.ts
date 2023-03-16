/** TypeError factory to create a simple error for type validation */
export const SimpleTypeError = <T extends object>(
  code: string,
  message: string,
) =>
  class SimpleError extends TypeError {
    code = code;

    constructor(data: T) {
      super(message);
      this.name = `${super.name} [${this.code}]`;
      Object.assign(this, data);
    }
  };
