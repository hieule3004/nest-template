import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingModule } from './config/logging/logging.module';
import { GlobalZodProvider } from './common/zod/provider';
import { GlobalConfigModule } from './common/config';

@Module({
  imports: [GlobalConfigModule(), LoggingModule],
  controllers: [AppController],
  providers: [GlobalZodProvider, AppService],
})
export class AppModule {}
