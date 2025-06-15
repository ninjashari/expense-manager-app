import mongoose, { Schema, Document, models, Types } from 'mongoose';
import { IAccount } from './account.model';
import { ICategory } from './category.model';

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  account: Types.ObjectId;
  category?: Types.ObjectId;
  type: 'Income' | 'Expense' | 'Transfer';
  amount: number;
  date: Date;
  payee: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PopulatedTransaction extends Omit<ITransaction, 'account' | 'category'> {
  account: IAccount;
  category?: ICategory;
}

const TransactionSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  account: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
  },
  type: {
    type: String,
    enum: ['Income', 'Expense', 'Transfer'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  payee: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
  },
}, { 
  timestamps: true,
  // Add compound indexes for efficient querying
  indexes: [
    { userId: 1, date: -1 }, // User transactions by date (most recent first)
    { userId: 1, account: 1, date: -1 }, // Account transactions by date
    { userId: 1, category: 1, date: -1 }, // Category transactions by date
    { userId: 1, type: 1, date: -1 }, // Transaction type by date
    { account: 1, date: 1 }, // Account transactions for bill generation
    { userId: 1, createdAt: -1 }, // Recent transactions for dashboard
  ]
});

// Add individual indexes for frequently queried fields
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ account: 1 });
TransactionSchema.index({ date: -1 });
TransactionSchema.index({ type: 1 });

const Transaction = models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction; 