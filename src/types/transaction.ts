/**
 * @file transaction.ts
 * @description This file contains type definitions for transaction management.
 * It defines the structure and validation for different types of financial transactions.
 */

import { Account } from './account'
import { Category } from './category'
import { Payee } from './payee'

/**
 * Transaction types enumeration
 * @description Defines the different types of transactions supported
 */
export type TransactionType = 'deposit' | 'withdrawal' | 'transfer'

/**
 * Transaction status enumeration
 * @description Defines the possible states of a transaction
 */
export type TransactionStatus = 'pending' | 'completed' | 'cancelled'

/**
 * Base transaction interface
 * @description Core transaction information structure
 */
export interface Transaction {
  id: string
  userId: string
  date: Date
  status: TransactionStatus
  type: TransactionType
  amount: number
  notes?: string
  createdAt: Date
  updatedAt: Date
  
  // For deposit/withdrawal transactions
  accountId?: string
  account?: Account
  payeeId?: string
  payee?: Payee
  categoryId?: string
  category?: Category
  
  // For transfer transactions
  fromAccountId?: string
  fromAccount?: Account
  toAccountId?: string
  toAccount?: Account
}

/**
 * Transaction form data interface for deposit/withdrawal
 * @description Structure for deposit/withdrawal transaction forms
 */
export interface DepositWithdrawalFormData {
  date: Date
  status: TransactionStatus
  type: 'deposit' | 'withdrawal'
  amount: number
  accountId: string
  payeeId?: string
  payeeName?: string // For creating new payee
  categoryId?: string
  categoryName?: string // For creating new category
  notes?: string
}

/**
 * Transaction form data interface for transfer
 * @description Structure for transfer transaction forms
 */
export interface TransferFormData {
  date: Date
  status: TransactionStatus
  type: 'transfer'
  amount: number
  fromAccountId: string
  toAccountId: string
  notes?: string
}

/**
 * Union type for all transaction form data
 * @description Combined type for all transaction forms
 */
export type TransactionFormData = DepositWithdrawalFormData | TransferFormData

/**
 * Transaction type options for UI
 * @description Human-readable labels for transaction types
 */
export const TRANSACTION_TYPE_OPTIONS = [
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'transfer', label: 'Transfer' },
] as const

/**
 * Transaction status options for UI
 * @description Human-readable labels for transaction statuses
 */
export const TRANSACTION_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

/**
 * Utility function to get transaction type label
 * @description Returns human-readable label for transaction type
 * @param type - Transaction type value
 * @returns Human-readable label
 */
export function getTransactionTypeLabel(type: TransactionType): string {
  return TRANSACTION_TYPE_OPTIONS.find(option => option.value === type)?.label || type
}

/**
 * Utility function to get transaction status label
 * @description Returns human-readable label for transaction status
 * @param status - Transaction status value
 * @returns Human-readable label
 */
export function getTransactionStatusLabel(status: TransactionStatus): string {
  return TRANSACTION_STATUS_OPTIONS.find(option => option.value === status)?.label || status
}

/**
 * Utility function to check if transaction is transfer type
 * @description Type guard to check if transaction is a transfer
 * @param transaction - Transaction object
 * @returns True if transaction is transfer type
 */
export function isTransferTransaction(transaction: Transaction): boolean {
  return transaction.type === 'transfer'
}

/**
 * Utility function to check if form data is transfer type
 * @description Type guard to check if form data is for transfer
 * @param formData - Transaction form data
 * @returns True if form data is for transfer
 */
export function isTransferFormData(formData: TransactionFormData): formData is TransferFormData {
  return formData.type === 'transfer'
}

/**
 * Utility function to get transaction display text
 * @description Returns appropriate display text based on transaction type
 * @param transaction - Transaction object
 * @returns Display text for the transaction
 */
export function getTransactionDisplayText(transaction: Transaction): string {
  if (transaction.type === 'transfer') {
    return `Transfer from ${transaction.fromAccount?.name || 'Unknown'} to ${transaction.toAccount?.name || 'Unknown'}`
  }
  
  const typeText = transaction.type === 'deposit' ? 'to' : 'from'
  const payeeText = transaction.payee?.displayName || 'Unknown'
  const accountText = transaction.account?.name || 'Unknown'
  
  return `${getTransactionTypeLabel(transaction.type)} ${typeText} ${payeeText} (${accountText})`
} 