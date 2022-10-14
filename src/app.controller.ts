import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/error')
  getError() {
    throw new RuntimeException('hihi');
  }

  @Get('/array')
  getArray() {
    return [{ a: 1 }, { b: 2 }, { c: 3 }];
  }
}
