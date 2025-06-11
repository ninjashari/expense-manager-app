import mongoose, { Schema, Document, models, Types } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  provider: 'credentials' | 'google' | 'github';
  createdAt: Date;
  updatedAt: Date;
  emailVerified?: Date;
  image?: string;
  accounts: Types.ObjectId[];
  currency: string;
}

const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    select: false, // Do not return password by default
  },
  provider: {
    type: String,
    enum: ['credentials', 'google', 'github'],
    required: true,
    default: 'credentials',
  },
  image: {
    type: String,
  },
  currency: {
    type: String,
    required: true,
    default: 'INR',
  }
}, { timestamps: true });

const User = models.User || mongoose.model<IUser>('User', UserSchema);

export default User; 