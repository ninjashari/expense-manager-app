/**
 * @file credit-card-service.ts
 * @description This file contains credit card service functions using API routes.
 * It provides credit card bill management, payment tracking, and account management.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import { 
  CreditCardBill, 
  CreditCardSummary, 
  BillGenerationParams,
  BillPaymentInfo
} from '@/types/credit-card'
import { Account } from '@/types/account'

/**
 * Get all credit card accounts for a user
 * @description Retrieves all credit card accounts belonging to the user via API
 * @param userId - User ID to filter accounts
 * @returns Promise resolving to array of credit card accounts
 */
export async function getCreditCardAccounts(userId: string): Promise<Account[]> {
  const response = await fetch('/api/accounts')
  if (!response.ok) {
    throw new Error('Failed to fetch accounts')
  }
  const data = await response.json()
  const accounts: Account[] = data.accounts
  return accounts.filter(account => account.type === 'credit_card' && account.creditCardInfo)
}

/**
 * Get credit card bills for an account
 * @description Stub implementation - returns empty array
 * @param accountId - Credit card account ID
 * @param userId - User ID for authorization
 * @returns Promise resolving to empty array
 */
export async function getCreditCardBills(_accountId: string, _userId: string): Promise<CreditCardBill[]> {
  // TODO: Implement PostgreSQL version with API route
  console.warn('Credit card bills feature is not yet implemented for PostgreSQL')
  return []
}

/**
 * Get all credit card bills for a user
 * @description Stub implementation - returns empty array
 * @param userId - User ID to filter bills
 * @returns Promise resolving to empty array
 */
export async function getAllCreditCardBills(_userId: string): Promise<CreditCardBill[]> {
  // TODO: Implement PostgreSQL version with API route
  console.warn('Credit card bills feature is not yet implemented for PostgreSQL')
  return []
}

/**
 * Generate credit card bill for a specific period
 * @description Stub implementation - throws error
 * @param params - Bill generation parameters
 * @param userId - User ID for authorization
 * @returns Promise that throws error
 */
export async function generateCreditCardBill(_params: BillGenerationParams, _userId: string): Promise<CreditCardBill> {
  throw new Error('Credit card bill generation is not yet implemented for PostgreSQL')
}

/**
 * Auto-generate bills for all credit card accounts
 * @description Stub implementation - returns empty array
 * @param userId - User ID for authorization
 * @returns Promise resolving to empty array
 */
export async function autoGenerateBills(_userId: string): Promise<CreditCardBill[]> {
  // TODO: Implement PostgreSQL version with API route
  console.warn('Auto bill generation is not yet implemented for PostgreSQL')
  return []
}

/**
 * Mark bill as paid
 * @description Stub implementation - throws error
 * @param paymentInfo - Payment information
 * @param userId - User ID for authorization
 * @returns Promise that throws error
 */
export async function markBillAsPaid(_paymentInfo: BillPaymentInfo, _userId: string): Promise<CreditCardBill | null> {
  throw new Error('Bill payment tracking is not yet implemented for PostgreSQL')
}

/**
 * Get credit card summaries for all accounts
 * @description Stub implementation that creates basic summaries from account data
 * @param userId - User ID for authorization
 * @returns Promise resolving to basic credit card summaries
 */
export async function getCreditCardSummaries(userId: string): Promise<CreditCardSummary[]> {
  try {
    const creditCardAccounts = await getCreditCardAccounts(userId)
    
    // Create basic summaries from account data
    return creditCardAccounts.map(account => {
      const creditInfo = account.creditCardInfo!
      const currentBalance = account.currentBalance
      const creditLimit = creditInfo.creditLimit
      const availableCredit = creditLimit + currentBalance // For credit cards, negative balance means used credit
      const creditUsagePercentage = creditInfo.creditUsagePercentage
      
      // Calculate next bill dates based on account settings
      const today = new Date()
      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()
      
      let nextBillGeneration = new Date(currentYear, currentMonth, creditInfo.billGenerationDate)
      if (nextBillGeneration <= today) {
        nextBillGeneration = new Date(currentYear, currentMonth + 1, creditInfo.billGenerationDate)
      }
      
      let nextPaymentDue = new Date(currentYear, currentMonth, creditInfo.paymentDueDate)
      if (nextPaymentDue <= today) {
        nextPaymentDue = new Date(currentYear, currentMonth + 1, creditInfo.paymentDueDate)
      }
      
      return {
        account,
        currentBalance,
        creditLimit,
        availableCredit,
        creditUsagePercentage,
        nextBillGenerationDate: nextBillGeneration,
        nextPaymentDueDate: nextPaymentDue,
        recentBills: [], // Empty for now
        monthlyAverageSpending: 0,
        lastMonthSpending: 0,
        spendingTrend: 0
      }
    })
  } catch (error) {
    console.warn('Failed to load credit card summaries:', error)
    return []
  }
}

/**
 * Delete credit card bill
 * @description Stub implementation - returns false
 * @param billId - ID of bill to delete
 * @param userId - User ID for authorization
 * @returns Promise resolving to false
 */
export async function deleteCreditCardBill(_billId: string, _userId: string): Promise<boolean> {
  // TODO: Implement PostgreSQL version with API route
  console.warn('Credit card bill deletion is not yet implemented for PostgreSQL')
  return false
} 