import { Document, model, Schema } from 'mongoose';

interface User extends Document {
  email: string;
  firstName: string;
  lastName: string;
}

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
});

const UserModel = model<User>('User', UserSchema);

export { User, UserSchema, UserModel };
