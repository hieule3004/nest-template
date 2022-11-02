import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingModule } from './config/logging/logging.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot(), LoggingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
