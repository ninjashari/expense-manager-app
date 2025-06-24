/**
 * @file transaction-import-service.ts
 * @description This file contains specialized service functions for transaction import operations.
 * It provides utilities for matching CSV data to existing entities and handling import logic.
 */

import { Account } from '@/types/account'
import { Category } from '@/types/category'
import { Payee } from '@/types/payee'
import { TransactionFormData } from '@/types/transaction'
import { createCategory } from './supabase-category-service'
import { createPayee } from './supabase-payee-service'
import { createTransaction } from './supabase-transaction-service'

/**
 * Interface for CSV transaction data structure
 * @description Represents a parsed transaction from CSV import
 */
export interface CSVTransactionData {
  id: string
  date: Date
  account: string
  payee: string
  category: string
  withdrawal: number
  deposit: number
  notes: string
  type: 'deposit' | 'withdrawal' | 'transfer'
  amount: number
  isTransfer: boolean
  transferToAccount?: string
  validationErrors: string[]
}

/**
 * Interface for import result tracking
 * @description Tracks the result of each transaction import attempt
 */
export interface TransactionImportResult {
  success: boolean
  transaction: CSVTransactionData
  error?: string
  createdPayee?: boolean
  createdCategory?: boolean
  accountId?: string
  payeeId?: string
  categoryId?: string
  fromAccountId?: string
  toAccountId?: string
}

/**
 * Interface for import options
 * @description Configuration options for the import process
 */
export interface ImportOptions {
  createMissingPayees?: boolean
  createMissingCategories?: boolean
  skipDuplicates?: boolean
  dryRun?: boolean
}

/**
 * Find account by name with fuzzy matching
 * @description Matches account name from CSV to existing accounts with case-insensitive and fuzzy matching
 * @param accountName - Account name from CSV
 * @param accounts - Array of existing accounts
 * @returns Account object or null if not found
 */
export function findAccountByName(accountName: string, accounts: Account[]): Account | null {
  if (!accountName) return null
  
  const normalizedName = accountName.toLowerCase().trim()
  
  // Exact match first
  let match = accounts.find(account => 
    account.name.toLowerCase().trim() === normalizedName
  )
  
  if (match) return match
  
  // Partial match (contains)
  match = accounts.find(account => 
    account.name.toLowerCase().trim().includes(normalizedName) ||
    normalizedName.includes(account.name.toLowerCase().trim())
  )
  
  return match || null
}

/**
 * Find category by name with fuzzy matching
 * @description Matches category name from CSV to existing categories
 * @param categoryName - Category name from CSV
 * @param categories - Array of existing categories
 * @returns Category object or null if not found
 */
export function findCategoryByName(categoryName: string, categories: Category[]): Category | null {
  if (!categoryName) return null
  
  const normalizedName = categoryName.toLowerCase().trim()
  
  // Check both display name and internal name
  return categories.find(category => 
    category.displayName.toLowerCase().trim() === normalizedName ||
    category.name.toLowerCase().trim() === normalizedName
  ) || null
}

/**
 * Find payee by name with fuzzy matching
 * @description Matches payee name from CSV to existing payees
 * @param payeeName - Payee name from CSV
 * @param payees - Array of existing payees
 * @returns Payee object or null if not found
 */
export function findPayeeByName(payeeName: string, payees: Payee[]): Payee | null {
  if (!payeeName) return null
  
  // Handle transfer transactions (payee starts with '>')
  if (payeeName.startsWith('>')) {
    return null // Transfer transactions don't use payees
  }
  
  const normalizedName = payeeName.toLowerCase().trim()
  
  // Check both display name and internal name
  return payees.find(payee => 
    payee.displayName.toLowerCase().trim() === normalizedName ||
    payee.name.toLowerCase().trim() === normalizedName
  ) || null
}

/**
 * Validate CSV transaction data
 * @description Validates parsed transaction data and returns validation errors
 * @param transaction - Parsed transaction data
 * @param accounts - Array of existing accounts
 * @returns Array of validation error messages
 */
export function validateTransactionData(
  transaction: CSVTransactionData,
  accounts: Account[]
): string[] {
  const errors: string[] = []
  
  // Check for existing validation errors
  errors.push(...transaction.validationErrors)
  
  // Validate account exists
  const account = findAccountByName(transaction.account, accounts)
  if (!account) {
    errors.push(`Account not found: ${transaction.account}`)
  }
  
  // Validate transfer destination account if it's a transfer
  if (transaction.isTransfer && transaction.transferToAccount) {
    const toAccount = findAccountByName(transaction.transferToAccount, accounts)
    if (!toAccount) {
      errors.push(`Transfer destination account not found: ${transaction.transferToAccount}`)
    }
    
    // Ensure transfer is not to the same account
    if (account && toAccount && account.id === toAccount.id) {
      errors.push('Transfer cannot be to the same account')
    }
  }
  
  // Validate amount is positive
  if (transaction.amount <= 0) {
    errors.push('Transaction amount must be positive')
  }
  
  return errors
}

/**
 * Import single transaction
 * @description Imports a single transaction with entity matching and optional creation
 * @param transaction - Parsed transaction data
 * @param accounts - Array of existing accounts
 * @param categories - Array of existing categories
 * @param payees - Array of existing payees
 * @param userId - User ID for creating new entities
 * @param options - Import options
 * @returns Promise resolving to import result
 */
export async function importSingleTransaction(
  transaction: CSVTransactionData,
  accounts: Account[],
  categories: Category[],
  payees: Payee[],
  userId: string,
  options: ImportOptions = {}
): Promise<TransactionImportResult> {
  
  const result: TransactionImportResult = {
    success: false,
    transaction,
    createdPayee: false,
    createdCategory: false
  }
  
  try {
    // Validate transaction data
    const validationErrors = validateTransactionData(transaction, accounts)
    if (validationErrors.length > 0) {
      result.error = validationErrors.join(', ')
      return result
    }
    
    // If dry run, just validate and return
    if (options.dryRun) {
      result.success = true
      return result
    }
    
    // Find or create entities
    const account = findAccountByName(transaction.account, accounts)!
    result.accountId = account.id
    
    if (transaction.isTransfer && transaction.transferToAccount) {
      // Handle transfer transaction
      const toAccount = findAccountByName(transaction.transferToAccount, accounts)!
      result.fromAccountId = account.id
      result.toAccountId = toAccount.id
      
      const transferData: TransactionFormData = {
        date: transaction.date,
        status: 'completed',
        type: 'transfer',
        amount: transaction.amount,
        fromAccountId: account.id,
        toAccountId: toAccount.id,
        notes: transaction.notes || undefined
      }
      
      await createTransaction(transferData, userId)
      result.success = true
      
    } else {
      // Handle deposit/withdrawal transaction
      let category = findCategoryByName(transaction.category, categories)
      let payee = findPayeeByName(transaction.payee, payees)
      
      // Create missing category if allowed
      if (!category && transaction.category && options.createMissingCategories) {
        try {
          category = await createCategory({
            displayName: transaction.category,
            description: `Auto-created during import`,
            isActive: true
          }, userId)
          result.createdCategory = true
        } catch (error) {
          console.warn('Failed to create category:', error)
        }
      }
      
      // Create missing payee if allowed
      if (!payee && transaction.payee && options.createMissingPayees) {
        try {
          payee = await createPayee({
            displayName: transaction.payee,
            description: `Auto-created during import`,
            isActive: true
          }, userId)
          result.createdPayee = true
        } catch (error) {
          console.warn('Failed to create payee:', error)
        }
      }
      
      result.payeeId = payee?.id
      result.categoryId = category?.id
      
      const transactionData: TransactionFormData = {
        date: transaction.date,
        status: 'completed',
        type: transaction.type as 'deposit' | 'withdrawal',
        amount: transaction.amount,
        accountId: account.id,
        payeeId: payee?.id,
        categoryId: category?.id,
        payeeName: payee ? undefined : (transaction.payee || undefined),
        categoryName: category ? undefined : (transaction.category || undefined),
        notes: transaction.notes || undefined
      }
      
      await createTransaction(transactionData, userId)
      result.success = true
    }
    
  } catch (error) {
    console.error('Error importing transaction:', error)
    result.error = error instanceof Error ? error.message : 'Unknown error occurred'
  }
  
  return result
}

/**
 * Import multiple transactions in batch
 * @description Imports multiple transactions with progress tracking
 * @param transactions - Array of parsed transaction data
 * @param accounts - Array of existing accounts
 * @param categories - Array of existing categories
 * @param payees - Array of existing payees
 * @param userId - User ID for creating new entities
 * @param options - Import options
 * @param onProgress - Progress callback function
 * @returns Promise resolving to array of import results
 */
export async function importTransactionsBatch(
  transactions: CSVTransactionData[],
  accounts: Account[],
  categories: Category[],
  payees: Payee[],
  userId: string,
  options: ImportOptions = {},
  onProgress?: (completed: number, total: number) => void
): Promise<TransactionImportResult[]> {
  
  const results: TransactionImportResult[] = []
  
  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i]
    
    const result = await importSingleTransaction(
      transaction,
      accounts,
      categories,
      payees,
      userId,
      options
    )
    
    results.push(result)
    
    // Report progress
    if (onProgress) {
      onProgress(i + 1, transactions.length)
    }
  }
  
  return results
}

/**
 * Generate import summary statistics
 * @description Analyzes import results and generates summary statistics
 * @param results - Array of import results
 * @returns Summary statistics object
 */
export function generateImportSummary(results: TransactionImportResult[]) {
  const summary = {
    total: results.length,
    successful: 0,
    failed: 0,
    transfers: 0,
    deposits: 0,
    withdrawals: 0,
    createdPayees: 0,
    createdCategories: 0,
    errors: [] as string[]
  }
  
  results.forEach(result => {
    if (result.success) {
      summary.successful++
      
      if (result.transaction.type === 'transfer') {
        summary.transfers++
      } else if (result.transaction.type === 'deposit') {
        summary.deposits++
      } else {
        summary.withdrawals++
      }
      
      if (result.createdPayee) {
        summary.createdPayees++
      }
      
      if (result.createdCategory) {
        summary.createdCategories++
      }
    } else {
      summary.failed++
      if (result.error) {
        summary.errors.push(result.error)
      }
    }
  })
  
  return summary
} 