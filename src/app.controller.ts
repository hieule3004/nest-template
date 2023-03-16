import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { AppService } from './app.service';
import { UserModel } from './user.dto';

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

  @Get('user')
  async getUser() {
    return UserModel.modelName;
  }
}
