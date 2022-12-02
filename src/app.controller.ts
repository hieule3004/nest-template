import {
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { AppService } from './app.service';
import { RfcParam } from './rfc.dto';
import { rfcValidator } from './common/validator/rfc';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/error')
  getError() {
    throw new InternalServerErrorException('not implemented');
  }

  @Get('/array')
  getArray() {
    return [{ a: 1 }, { b: 2 }, { c: 3 }];
  }

  @Post('rfc')
  async getRfc(
    @Req() req: any,
    @Query() { parser, value }: RfcParam,
  ): Promise<any> {
    return { result: rfcValidator(parser, value) };
  }
}
