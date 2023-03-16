import { MongooseModule } from '@nestjs/mongoose';
import { fromEnv } from './dotenv';

export const GlobalMongooseModule = MongooseModule.forRootAsync({
  useFactory: async () => ({
    uri: fromEnv('MONGO_URL'),
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }),
});
