import { InferSchemaType, model, Schema } from 'mongoose';

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String },
});

type User = InferSchemaType<typeof UserSchema>;

const UserModel = model<User>('User', UserSchema);

export { User, UserSchema, UserModel };
