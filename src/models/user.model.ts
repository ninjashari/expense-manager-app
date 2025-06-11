import mongoose, { Schema, Document, models } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  provider: 'credentials' | 'google' | 'github';
  createdAt: Date;
  updatedAt: Date;
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
}, { timestamps: true });

const User = models.User || mongoose.model<IUser>('User', UserSchema);

export default User; 