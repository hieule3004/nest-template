import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingModule } from './config/logging/logging.module';
import { ConfigModule } from '@nestjs/config';
import { GlobalValidationProvider } from './config/validation';
import { UserModule } from './user/user.module';

@Module({
  imports: [ConfigModule.forRoot(), LoggingModule, UserModule],
  controllers: [AppController],
  providers: [GlobalValidationProvider, AppService],
})
export class AppModule {}
