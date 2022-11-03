import { Body, Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception';
import { RfcParam, RfcResponse } from './rfc.dto';
import { phoneValidator } from './common/validator';
import { ApiResponse } from '@nestjs/swagger';

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
  @ApiResponse({
    status: 200,
    schema: {
      type: 'number',
      format: 'float',
    },
  })
  getRfc(@Req() req: any, @Body() { value }: RfcParam): RfcResponse {
    return { result: phoneValidator(String(value)) };
  }
}
