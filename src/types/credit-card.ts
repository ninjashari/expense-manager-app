/**
 * @file credit-card.ts
 * @description This file contains type definitions for credit card management.
 * It includes interfaces for credit card accounts, bills, and related data structures.
 */

export type AccountType = 'checking' | 'savings' | 'credit-card' | 'investment' | 'loan' | 'other'

/**
 * Credit card information
 * @description Detailed information for credit card accounts
 */
export interface CreditCardInfo {
  creditLimit: number
  balance: number
  creditUsage: number
  creditUsagePercentage: number
  billGenerationDate: number
  paymentDueDate: number
  interestRate: number
}
