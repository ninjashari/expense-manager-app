/**
 * Credit Card Bill Utilities
 * 
 * This module provides utility functions for credit card bill generation,
 * calculation, and management. It includes functions for automatic bill
 * generation, payment processing, and bill status management.
 */

import { Types } from 'mongoose';
import { addDays, addMonths } from 'date-fns';
import CreditCardBill, { ICreditCardBill } from '@/models/credit-card-bill.model';
import Account, { IAccount } from '@/models/account.model';
import Transaction from '@/models/transaction.model';
import { BillGenerationResult, BillCalculation, PopulatedCreditCardBill } from '@/types/credit-card-bill.types';

/**
 * Generate billing period dates based on account settings
 * @param account - The credit card account
 * @param referenceDate - Reference date for calculation (default: current date)
 * @returns Object with billing period start and end dates
 */
export function generateBillingPeriod(
  account: IAccount,
  referenceDate: Date = new Date()
): { start: Date; end: Date } {
  const billGenerationDay = account.billGenerationDay || 1;
  
  // Calculate the billing period end date
  let billingPeriodEnd = new Date(referenceDate);
  billingPeriodEnd.setDate(billGenerationDay);
  
  // If we're past the bill generation day, move to next month
  if (referenceDate.getDate() > billGenerationDay) {
    billingPeriodEnd = addMonths(billingPeriodEnd, 1);
  }
  
  // Billing period start is one month before end
  const billingPeriodStart = addMonths(billingPeriodEnd, -1);
  billingPeriodStart.setDate(billGenerationDay + 1);
  
  return {
    start: billingPeriodStart,
    end: billingPeriodEnd,
  };
}

/**
 * Calculate bill due date based on account settings
 * @param billingPeriodEnd - End of billing period
 * @param account - The credit card account
 * @returns Bill due date
 */
export function calculateBillDueDate(
  billingPeriodEnd: Date,
  account: IAccount
): Date {
  const billDueDay = account.billDueDay || 21; // Default 21 days after billing period end
  
  if (billDueDay <= 31) {
    // If billDueDay is a day of month, use it
    const dueDate = new Date(billingPeriodEnd);
    dueDate.setMonth(dueDate.getMonth() + 1);
    dueDate.setDate(Math.min(billDueDay, new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate()));
    return dueDate;
  } else {
    // If billDueDay is number of days, add to billing period end
    return addDays(billingPeriodEnd, billDueDay);
  }
}

/**
 * Calculate bill amount and details for a billing period
 * @param accountId - Account ID
 * @param userId - User ID
 * @param billingPeriodStart - Start of billing period
 * @param billingPeriodEnd - End of billing period
 * @returns Bill calculation details
 */
export async function calculateBillAmount(
  accountId: Types.ObjectId,
  userId: Types.ObjectId,
  billingPeriodStart: Date,
  billingPeriodEnd: Date
): Promise<BillCalculation> {
  // Get all transactions for the billing period
  const transactions = await Transaction.find({
    account: accountId,
    userId: userId,
    date: {
      $gte: billingPeriodStart,
      $lte: billingPeriodEnd,
    },
  }).sort({ date: 1 });

  // Calculate new charges (expenses) and payments/credits (income)
  let newCharges = 0;
  let paymentsCredits = 0;

  transactions.forEach((transaction) => {
    if (transaction.type === 'Expense') {
      newCharges += transaction.amount;
    } else if (transaction.type === 'Income') {
      paymentsCredits += transaction.amount;
    }
  });

  // Get previous balance (current account balance minus current period transactions)
  const account = await Account.findById(accountId);
  const currentBalance = account?.balance || 0;
  const previousBalance = currentBalance - newCharges + paymentsCredits;

  // Calculate interest charges (simplified - in real world, this would be more complex)
  const interestRate = account?.interestRate || 0;
  const monthlyInterestRate = interestRate / 12;
  const interestCharges = Math.round(Math.abs(previousBalance) * monthlyInterestRate);

  // Calculate late fees (if previous bill was overdue)
  let lateFees = 0;
  const previousBill = await CreditCardBill.findOne({
    accountId,
    userId,
    billDueDate: { $lt: billingPeriodStart },
    status: { $in: ['overdue', 'partial'] },
  }).sort({ billDueDate: -1 });

  if (previousBill) {
    lateFees = 3500; // $35 late fee in cents
  }

  // Total bill amount
  const totalAmount = Math.abs(previousBalance) + newCharges + interestCharges + lateFees - paymentsCredits;

  // Calculate minimum payment
  const minimumPaymentPercentage = account?.minimumPaymentPercentage || 0.05;
  const minimumPayment = Math.max(
    Math.round(totalAmount * minimumPaymentPercentage),
    2500 // Minimum $25
  );

  return {
    totalAmount: Math.max(0, totalAmount),
    minimumPayment,
    interestCharges,
    lateFees,
    previousBalance: Math.abs(previousBalance),
    newCharges,
    paymentsCredits,
  };
}

/**
 * Generate a credit card bill for an account
 * @param accountId - Account ID
 * @param userId - User ID
 * @param billingPeriodStart - Optional start date (auto-calculated if not provided)
 * @param billingPeriodEnd - Optional end date (auto-calculated if not provided)
 * @returns Bill generation result
 */
export async function generateBill(
  accountId: string,
  userId: string,
  billingPeriodStart?: Date,
  billingPeriodEnd?: Date
): Promise<BillGenerationResult> {
  try {
    const account = await Account.findById(accountId);
    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    if (account.type !== 'Credit Card') {
      return { success: false, error: 'Account is not a credit card' };
    }

    // Generate billing period if not provided
    let periodStart = billingPeriodStart;
    let periodEnd = billingPeriodEnd;

    if (!periodStart || !periodEnd) {
      const period = generateBillingPeriod(account);
      periodStart = period.start;
      periodEnd = period.end;
    }

    // Check if bill already exists for this period
    const existingBill = await CreditCardBill.findOne({
      accountId: new Types.ObjectId(accountId),
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
    });

    if (existingBill) {
      return { 
        success: false, 
        error: 'Bill already exists for this billing period',
        bill: existingBill as PopulatedCreditCardBill
      };
    }

    // Calculate bill amount and details
    const calculation = await calculateBillAmount(
      new Types.ObjectId(accountId),
      new Types.ObjectId(userId),
      periodStart!,
      periodEnd!
    );

    // Generate bill due date
    const billDueDate = calculateBillDueDate(periodEnd!, account);

    // Create the bill
    const bill = new CreditCardBill({
      userId: new Types.ObjectId(userId),
      accountId: new Types.ObjectId(accountId),
      billGenerationDate: new Date(),
      billDueDate,
      billAmount: calculation.totalAmount,
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
      minimumPayment: calculation.minimumPayment,
      interestRate: account.interestRate,
      lateFeesApplied: calculation.lateFees,
      transactionCount: await Transaction.countDocuments({
        account: accountId,
        userId,
        date: { $gte: periodStart, $lte: periodEnd },
      }),
      status: 'generated',
    });

    const savedBill = await bill.save();
    
    // Populate the account information
    const populatedBill = await CreditCardBill.findById(savedBill._id)
      .populate('accountId', 'name type currency creditLimit');

    return {
      success: true,
      bill: populatedBill as PopulatedCreditCardBill,
      warnings: calculation.lateFees > 0 ? ['Late fees applied due to previous overdue bill'] : undefined,
    };
  } catch (error) {
    console.error('Error generating bill:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Mark a bill as paid
 * @param billId - Bill ID
 * @param amount - Amount paid in cents
 * @param paidDate - Date of payment (default: current date)
 * @returns Updated bill
 */
export async function markBillAsPaid(
  billId: string,
  amount: number,
  paidDate: Date = new Date()
): Promise<ICreditCardBill | null> {
  try {
    const bill = await CreditCardBill.findById(billId);
    if (!bill) {
      throw new Error('Bill not found');
    }

    return await bill.markAsPaid(amount, paidDate);
  } catch (error) {
    console.error('Error marking bill as paid:', error);
    throw error;
  }
}

/**
 * Get bills summary for dashboard
 * @param userId - User ID
 * @returns Bills summary
 */
export async function getBillsSummary(userId: string) {
  try {
    const bills = await CreditCardBill.find({ userId }).populate('accountId', 'name currency');

    const summary = {
      totalOutstanding: 0,
      totalOverdue: 0,
      upcomingDue: 0,
      billsCount: {
        total: bills.length,
        paid: 0,
        unpaid: 0,
        overdue: 0,
      },
      nextDueDate: undefined as Date | undefined,
    };

    const today = new Date();
    const nextWeek = addDays(today, 7);
    let earliestDueDate: Date | undefined;

    bills.forEach((bill) => {
      if (bill.isPaid) {
        summary.billsCount.paid++;
      } else {
        summary.billsCount.unpaid++;
        summary.totalOutstanding += bill.billAmount;

        if (bill.billDueDate < today) {
          summary.billsCount.overdue++;
          summary.totalOverdue += bill.billAmount;
        } else if (bill.billDueDate <= nextWeek) {
          summary.upcomingDue += bill.billAmount;
        }

        if (!earliestDueDate || bill.billDueDate < earliestDueDate) {
          earliestDueDate = bill.billDueDate;
        }
      }
    });

    summary.nextDueDate = earliestDueDate;

    return summary;
  } catch (error) {
    console.error('Error getting bills summary:', error);
    throw error;
  }
}

/**
 * Auto-generate bills for all credit card accounts that need them
 * @param userId - User ID
 * @returns Array of generation results
 */
export async function autoGenerateBills(userId: string): Promise<BillGenerationResult[]> {
  try {
    const creditCardAccounts = await Account.find({
      userId,
      type: 'Credit Card',
      billGenerationDay: { $exists: true, $ne: null },
    });

    const results: BillGenerationResult[] = [];

    for (const account of creditCardAccounts) {
      const period = generateBillingPeriod(account);
      
      // Check if we should generate a bill (if we're at or past the generation day)
      const today = new Date();
      if (today >= period.end) {
        const result = await generateBill(
          account._id.toString(),
          userId,
          period.start,
          period.end
        );
        results.push(result);
      }
    }

    return results;
  } catch (error) {
    console.error('Error auto-generating bills:', error);
    return [{
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }];
  }
}

/**
 * Format bill amount for display
 * @param amount - Amount in cents
 * @param currency - Currency code
 * @returns Formatted amount string
 */
export function formatBillAmount(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100);
}

/**
 * Get bill status color for UI
 * @param status - Bill status
 * @returns Color class name
 */
export function getBillStatusColor(status: string): string {
  switch (status) {
    case 'paid':
      return 'text-green-600 bg-green-50';
    case 'overdue':
      return 'text-red-600 bg-red-50';
    case 'partial':
      return 'text-orange-600 bg-orange-50';
    case 'generated':
    case 'sent':
      return 'text-blue-600 bg-blue-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
} 