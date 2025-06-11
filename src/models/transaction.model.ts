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
}, { timestamps: true });

const Transaction = models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction; 