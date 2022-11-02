import { Model } from 'mongoose';
import { User } from './dto/user.model';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UserService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async createUser({ email, firstName, lastName }: any): Promise<void> {
    const user = new this.userModel({ email, firstName, lastName });
    await user.save();
  }
}
