import { INestApplication, Type } from '@nestjs/common';

/**
 * Use in place of {@external app.get} with no error
 * */
const safeGetInstance = <T>(
  app: INestApplication,
  target: Type<T>,
): T | undefined =>
  (app as any)._instanceLinksHost?.instanceLinks.get(target)?.wrapperRef
    ?.instance;

export { safeGetInstance };
