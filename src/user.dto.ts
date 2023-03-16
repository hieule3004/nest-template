import * as mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
});

const UserModel = mongoose.model('UserModel', UserSchema);

export { UserSchema, UserModel };
