/**
 * @file account.ts
 * @description This file contains type definitions for account management.
 * It defines the structure and validation for different types of financial accounts.
 */

/**
 * Account types enumeration
 * @description Defines the different types of accounts supported
 */
export type AccountType = 
  | 'savings'
  | 'checking'
  | 'credit_card'
  | 'investment'
  | 'cash'
  | 'loan'
  | 'other'

/**
 * Account status enumeration
 * @description Defines the possible states of an account
 */
export type AccountStatus = 'active' | 'inactive' | 'closed'

/**
 * Currency enumeration
 * @description Supported currencies (extensible for future)
 */
export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP'

/**
 * Credit card specific information
 * @description Additional fields required for credit card accounts
 */
export interface CreditCardInfo {
  creditLimit: number
  paymentDueDate: number // Day of month (1-31)
  billGenerationDate: number // Day of month (1-31)
  currentBillPaid: boolean // Whether current month's bill is paid
  creditUsagePercentage: number // Percentage of credit limit used (0-100)
}

/**
 * Base account interface
 * @description Core account information structure
 */
export interface Account {
  id: string
  userId: string
  name: string
  type: AccountType
  status: AccountStatus
  initialBalance: number
  currentBalance: number
  currency: Currency
  accountOpeningDate: Date
  notes?: string
  creditCardInfo?: CreditCardInfo
  creditUsagePercentage?: number // For credit cards, percentage of credit used
  createdAt: Date
  updatedAt: Date
}

/**
 * Account form data interface
 * @description Structure for account creation/editing forms
 */
export interface AccountFormData {
  name: string
  type: AccountType
  status: AccountStatus
  initialBalance: number
  currency: Currency
  accountOpeningDate: Date
  notes?: string
  // Credit card specific fields
  creditLimit?: number
  paymentDueDate?: number
  billGenerationDate?: number
  currentBillPaid?: boolean
  creditUsagePercentage?: number
}

/**
 * Account API request data interface
 * @description Structure for API requests (JSON serialization converts Date to string)
 */
export interface AccountApiRequestData {
  name: string
  type: AccountType
  status: AccountStatus
  initialBalance: number
  currency: Currency
  accountOpeningDate: Date | string // Can be Date object or ISO string from JSON
  notes?: string
  // Credit card specific fields
  creditLimit?: number
  paymentDueDate?: number
  billGenerationDate?: number
  currentBillPaid?: boolean
  creditUsagePercentage?: number
}

/**
 * Account type options for UI
 * @description Human-readable labels for account types
 */
export const ACCOUNT_TYPE_OPTIONS = [
  { value: 'savings', label: 'Savings Account' },
  { value: 'checking', label: 'Checking Account' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'investment', label: 'Investment Account' },
  { value: 'cash', label: 'Cash/Wallet' },
  { value: 'loan', label: 'Loan Account' },
  { value: 'other', label: 'Other' },
] as const

/**
 * Account status options for UI
 * @description Human-readable labels for account statuses
 */
export const ACCOUNT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'closed', label: 'Closed' },
] as const

/**
 * Currency options for UI
 * @description Supported currencies with symbols
 */
export const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'Indian Rupee (₹)', symbol: '₹' },
  { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
  { value: 'EUR', label: 'Euro (€)', symbol: '€' },
  { value: 'GBP', label: 'British Pound (£)', symbol: '£' },
] as const

/**
 * Utility function to get account type label
 * @description Returns human-readable label for account type
 * @param type - Account type value
 * @returns Human-readable label
 */
export function getAccountTypeLabel(type: AccountType): string {
  return ACCOUNT_TYPE_OPTIONS.find(option => option.value === type)?.label || type
}

/**
 * Utility function to get account status label
 * @description Returns human-readable label for account status
 * @param status - Account status value
 * @returns Human-readable label
 */
export function getAccountStatusLabel(status: AccountStatus): string {
  return ACCOUNT_STATUS_OPTIONS.find(option => option.value === status)?.label || status
}

/**
 * Utility function to get currency symbol
 * @description Returns currency symbol for given currency code
 * @param currency - Currency code
 * @returns Currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_OPTIONS.find(option => option.value === currency)?.symbol || currency
} 