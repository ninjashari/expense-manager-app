import mongoose, { Schema, Document, models, Types } from 'mongoose';

export interface IAccount extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  type: 'Checking' | 'Savings' | 'Credit Card' | 'Cash' | 'Investment';
  balance: number;
  currency: string;
  creditLimit?: number; // Optional field for credit card accounts
  billGenerationDay?: number; // Day of month for bill generation (1-31)
  billDueDay?: number; // Day of month for bill due date (1-31)
  interestRate?: number; // Annual interest rate as decimal (e.g., 0.18 for 18%)
  minimumPaymentPercentage?: number; // Minimum payment as percentage (e.g., 0.05 for 5%)
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
  billGenerationDay: {
    type: Number,
    required: false,
    min: 1,
    max: 31,
    default: null,
  },
  billDueDay: {
    type: Number,
    required: false,
    min: 1,
    max: 31,
    default: null,
  },
  interestRate: {
    type: Number,
    required: false,
    min: 0,
    max: 1, // Maximum 100% annual rate
    default: null,
  },
  minimumPaymentPercentage: {
    type: Number,
    required: false,
    min: 0,
    max: 1, // Maximum 100%
    default: 0.05, // Default 5%
  },
}, { timestamps: true });

const Account = models.Account || mongoose.model<IAccount>('Account', AccountSchema);

export default Account; 