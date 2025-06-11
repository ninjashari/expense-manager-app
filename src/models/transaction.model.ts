import mongoose, { Schema, Document, models, Types } from 'mongoose';

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  accountId: Types.ObjectId;
  categoryId?: Types.ObjectId;
  type: 'Income' | 'Expense' | 'Transfer';
  amount: number;
  date: Date;
  payee: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  accountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  categoryId: {
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