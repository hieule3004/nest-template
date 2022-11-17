import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingModule } from './config/logging/logging.module';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/dotenv';
import { GlobalZodProvider } from './common/zod/provider';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    LoggingModule,
  ],
  controllers: [AppController],
  providers: [GlobalZodProvider, AppService],
})
export class AppModule {}
