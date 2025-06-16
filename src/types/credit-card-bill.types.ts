/**
 * Credit Card Bill Types
 * 
 * This file contains all TypeScript interfaces and types related to credit card
 * bill management, including API request/response types and component props.
 */

// Types for credit card bill functionality

// Core bill status enum
export type BillStatus = 'generated' | 'sent' | 'paid' | 'overdue' | 'partial';

// Base credit card bill interface
export interface CreditCardBill {
  _id: string;
  userId: string;
  accountId: string;
  billGenerationDate: Date;
  billDueDate: Date;
  billAmount: number; // Amount in cents
  isPaid: boolean;
  paidDate?: Date;
  paidAmount?: number; // Amount actually paid in cents
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  transactionCount: number;
  minimumPayment: number; // Minimum payment required in cents
  interestRate?: number; // Annual interest rate as decimal
  lateFeesApplied: number; // Late fees in cents
  notes?: string;
  status: BillStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Populated bill with account information
export interface PopulatedCreditCardBill extends CreditCardBill {
  account: {
    _id: string;
    name: string;
    type: string;
    currency: string;
    creditLimit?: number;
  };
}

// Bill creation request
export interface CreateBillRequest {
  accountId: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  billAmount?: number; // Optional, will be calculated if not provided
  notes?: string;
}

// Bill update request
export interface UpdateBillRequest {
  isPaid?: boolean;
  paidAmount?: number;
  paidDate?: Date;
  notes?: string;
  status?: BillStatus;
}

// Bill payment request
export interface PayBillRequest {
  amount: number; // Amount in cents
  paidDate?: Date;
  notes?: string;
}

// Bill generation settings for account
export interface BillGenerationSettings {
  billGenerationDay: number; // Day of month (1-31)
  billDueDay: number; // Day of month (1-31)
  interestRate?: number; // Annual rate as decimal
  minimumPaymentPercentage?: number; // Percentage as decimal
  gracePeriodDays?: number; // Grace period in days
  lateFeeAmount?: number; // Late fee amount
  enableAutoGeneration?: boolean; // Enable automatic bill generation
  enableNotifications?: boolean; // Enable bill notifications
  notificationDays?: number[]; // Days before due date to send notifications
  enableEmailNotifications?: boolean; // Enable email notifications
  enableSmsNotifications?: boolean; // Enable SMS notifications
  currency?: string; // Currency for the account
  notes?: string; // Additional notes
}

// Bill summary for dashboard
export interface BillSummary {
  totalOutstanding: number; // Total unpaid bills in cents
  totalOverdue: number; // Total overdue bills in cents
  upcomingDue: number; // Bills due in next 7 days in cents
  billsCount: {
    total: number;
    paid: number;
    unpaid: number;
    overdue: number;
  };
  nextDueDate?: Date;
}

// Bill filters for API queries
export interface BillFilters {
  accountId?: string;
  status?: BillStatus | BillStatus[];
  isPaid?: boolean;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  billAmountMin?: number;
  billAmountMax?: number;
  page?: number;
  limit?: number;
  sortBy?: 'billDueDate' | 'billAmount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// API response types
export interface BillsResponse {
  bills: PopulatedCreditCardBill[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary?: BillSummary;
}

export interface BillResponse {
  bill: PopulatedCreditCardBill;
  message?: string;
}

// Component prop types
export interface BillCardProps {
  bill: PopulatedCreditCardBill;
  onPayBill: (billId: string, amount: number) => void;
  onUpdateBill: (billId: string, updates: UpdateBillRequest) => void;
  onDeleteBill?: (billId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

export interface BillSettingsFormProps {
  accountId: string;
  initialSettings?: BillGenerationSettings;
  onSave: (settings: BillGenerationSettings) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export interface PayBillDialogProps {
  bill: PopulatedCreditCardBill;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, paidDate?: Date) => void;
  disabled?: boolean;
}

export interface BillsTableProps {
  bills: PopulatedCreditCardBill[];
  onPayBill: (billId: string, amount: number) => void;
  onUpdateBill: (billId: string, updates: UpdateBillRequest) => void;
  onDeleteBill?: (billId: string) => void;
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onPageChange?: (page: number) => void;
}

// Utility types for bill calculations
export interface BillCalculation {
  totalAmount: number; // Total bill amount in cents
  minimumPayment: number; // Minimum payment in cents
  interestCharges: number; // Interest charges in cents
  lateFees: number; // Late fees in cents
  previousBalance: number; // Previous balance in cents
  newCharges: number; // New charges in cents
  paymentsCredits: number; // Payments and credits in cents
}

// Bill generation result
export interface BillGenerationResult {
  success: boolean;
  bill?: PopulatedCreditCardBill;
  error?: string;
  warnings?: string[];
}

// Bulk bill operations
export interface BulkBillOperation {
  billIds: string[];
  operation: 'markPaid' | 'markUnpaid' | 'delete' | 'updateStatus';
  data?: {
    paidAmount?: number;
    paidDate?: Date;
    status?: BillStatus;
  };
}

export interface BulkBillResult {
  success: boolean;
  processed: number;
  failed: number;
  errors?: string[];
} 