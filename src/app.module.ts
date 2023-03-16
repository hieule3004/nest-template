import { Module } from '@nestjs/common';
import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';
import { LoggingModule } from 'src/config/logging/logging.module';
import { GlobalZodProvider } from 'src/utils/zod/provider';
import { GlobalConfigModule } from 'src/config/dotenv';
import { GlobalMongooseModule } from 'src/config/mongo';

@Module({
  imports: [GlobalConfigModule(), GlobalMongooseModule, LoggingModule],
  controllers: [AppController],
  providers: [GlobalZodProvider, AppService],
})
export class AppModule {}
