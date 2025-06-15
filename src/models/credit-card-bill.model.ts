/**
 * Credit Card Bill Model
 * 
 * This model handles credit card bill generation, tracking, and payment management.
 * It supports automatic bill generation based on account settings and provides
 * comprehensive bill lifecycle management.
 */

import mongoose, { Schema, Document, models, Types } from 'mongoose';

export interface ICreditCardBill extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  accountId: Types.ObjectId;
  billGenerationDate: Date;
  billDueDate: Date;
  billAmount: number; // Amount in cents
  isPaid: boolean;
  paidDate?: Date;
  paidAmount?: number; // Amount actually paid in cents
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  transactionCount: number; // Number of transactions in this billing period
  minimumPayment: number; // Minimum payment required in cents
  interestRate?: number; // Annual interest rate as decimal (e.g., 0.18 for 18%)
  lateFeesApplied: number; // Late fees in cents
  notes?: string;
  status: 'generated' | 'sent' | 'paid' | 'overdue' | 'partial';
  createdAt: Date;
  updatedAt: Date;
}

const CreditCardBillSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  accountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
    index: true,
  },
  billGenerationDate: {
    type: Date,
    required: true,
    index: true,
  },
  billDueDate: {
    type: Date,
    required: true,
    index: true,
  },
  billAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  isPaid: {
    type: Boolean,
    default: false,
    index: true,
  },
  paidDate: {
    type: Date,
    default: null,
  },
  paidAmount: {
    type: Number,
    default: null,
    min: 0,
  },
  billingPeriodStart: {
    type: Date,
    required: true,
  },
  billingPeriodEnd: {
    type: Date,
    required: true,
  },
  transactionCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  minimumPayment: {
    type: Number,
    required: true,
    min: 0,
  },
  interestRate: {
    type: Number,
    default: null,
    min: 0,
    max: 1, // Maximum 100% annual rate
  },
  lateFeesApplied: {
    type: Number,
    default: 0,
    min: 0,
  },
  notes: {
    type: String,
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ['generated', 'sent', 'paid', 'overdue', 'partial'],
    default: 'generated',
    index: true,
  },
}, { 
  timestamps: true,
  // Add compound indexes for efficient querying
  indexes: [
    { userId: 1, accountId: 1 },
    { userId: 1, billDueDate: 1 },
    { userId: 1, status: 1 },
    { accountId: 1, billingPeriodStart: 1, billingPeriodEnd: 1 },
  ]
});

// Pre-save middleware to calculate minimum payment if not provided
CreditCardBillSchema.pre('save', function(next) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bill = this as any;
  
  if (!bill.minimumPayment && bill.billAmount) {
    // Default minimum payment is 5% of bill amount or $25, whichever is higher
    const fivePercent = Math.round(bill.billAmount * 0.05);
    const minimumFloor = 2500; // $25 in cents
    bill.minimumPayment = Math.max(fivePercent, minimumFloor);
  }
  
  // Update status based on payment and due date
  if (bill.isPaid && bill.paidAmount && bill.paidAmount >= bill.billAmount) {
    bill.status = 'paid';
  } else if (bill.isPaid && bill.paidAmount && bill.paidAmount < bill.billAmount) {
    bill.status = 'partial';
  } else if (!bill.isPaid && new Date() > bill.billDueDate) {
    bill.status = 'overdue';
  }
  
  next();
});

// Instance method to mark bill as paid
CreditCardBillSchema.methods.markAsPaid = function(amount?: number, paidDate?: Date) {
  this.isPaid = true;
  this.paidDate = paidDate || new Date();
  this.paidAmount = amount || this.billAmount;
  
  if (this.paidAmount >= this.billAmount) {
    this.status = 'paid';
  } else {
    this.status = 'partial';
  }
  
  return this.save();
};

// Instance method to calculate days overdue
CreditCardBillSchema.methods.getDaysOverdue = function(): number {
  if (this.isPaid || new Date() <= this.billDueDate) {
    return 0;
  }
  
  const today = new Date();
  const diffTime = today.getTime() - this.billDueDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Bill generation is handled by the bill-utils.ts module

// Ensure unique bill per account per billing period
CreditCardBillSchema.index(
  { accountId: 1, billingPeriodStart: 1, billingPeriodEnd: 1 },
  { unique: true }
);

const CreditCardBill = models.CreditCardBill || mongoose.model<ICreditCardBill>('CreditCardBill', CreditCardBillSchema);

export default CreditCardBill; 