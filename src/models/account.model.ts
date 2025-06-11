import mongoose, { Schema, Document, models, Types } from 'mongoose';

export interface IAccount extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  type: 'Checking' | 'Savings' | 'Credit Card' | 'Cash' | 'Investment';
  balance: number;
  currency: string;
  creditLimit?: number; // Optional field for credit card accounts
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['Checking', 'Savings', 'Credit Card', 'Cash', 'Investment'],
    required: true,
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
  },
  currency: {
    type: String,
    required: true,
  },
  creditLimit: {
    type: Number,
    required: false,
    default: null,
  },
}, { timestamps: true });

const Account = models.Account || mongoose.model<IAccount>('Account', AccountSchema);

export default Account; 