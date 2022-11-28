import { ConfigModule } from '@nestjs/config';
import { validate } from '../config/dotenv';

export const GlobalConfigModule = () => ConfigModule.forRoot({ validate });
