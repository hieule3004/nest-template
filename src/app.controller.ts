import { Body, Controller, Get, Param, Req, UsePipes } from '@nestjs/common';
import { AppService } from './app.service';
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception';
import { RfcParam, RfcParamJoiSchema, RfcResponse } from './rfc.dto';
import { phoneValidator } from './common/validator';
import { JoiValidationPipe } from './common/joi-pipe';
import * as joi from 'joi';

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
  @UsePipes(new JoiValidationPipe(undefined, joi.number(), RfcParamJoiSchema))
  getRfc(
    @Req() req: any,
    @Param('abc') param: any,
    @Body() { value }: any,
  ): RfcResponse {
    return { result: phoneValidator(String(value)) };
  }
}
