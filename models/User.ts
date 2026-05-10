import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  provider: string;
  image?: string;
  domain?: 'tech' | 'commerce' | 'engineering' | 'medical';
  createdAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      // Optional for OAuth users
    },
    provider: {
      type: String,
      default: 'credentials',
    },
    image: {
      type: String,
    },
    domain: {
      type: String,
      enum: ['tech', 'commerce', 'engineering', 'medical'],
      default: 'tech',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
