import { Controller, Get, Param, Req, UsePipes } from '@nestjs/common';
import { AppService } from './app.service';
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception';
import { RfcParam, RfcParamJoiSchema, RfcResponse } from './rfc.dto';
import { phoneValidator } from './common/validator';
import { JoiValidationPipe } from './common/joi-pipe';

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
  getRfc(@Req() req: any, @Param() { value }: any): RfcResponse {
    return { result: phoneValidator(String(value)) };
  }
}
