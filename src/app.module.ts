import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingModule } from './config/logging/logging.module';
import { ConfigModule } from '@nestjs/config';
import { GlobalValidationProvider } from './config/validation';
import { validate } from './common/dotenv';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    LoggingModule,
  ],
  controllers: [AppController],
  providers: [GlobalValidationProvider, AppService],
})
export class AppModule {}
