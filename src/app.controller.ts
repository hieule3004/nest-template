import { Controller, Get, Param, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception';
import { RfcParam, RfcResponse } from './rfc.dto';
import { phoneValidator } from './common/validator/rfc';

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

  @Get('rfc/:value')
  getRfc(@Req() req: any, @Param() { value }: RfcParam): RfcResponse {
    // return { result: phoneValidator(String(value)) };
    return { result: undefined };
  }
}
