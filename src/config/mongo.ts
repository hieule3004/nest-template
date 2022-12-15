import { MongooseModule, MongooseModuleFactoryOptions } from '@nestjs/mongoose';
import { fromEnv } from './dotenv';

const MongooseModuleFactory: () => Promise<MongooseModuleFactoryOptions> =
  async () => ({
    uri: fromEnv('MONGO_URL'),
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  });

MongooseModule.forRootAsync({
  useFactory: MongooseModuleFactory,
});
