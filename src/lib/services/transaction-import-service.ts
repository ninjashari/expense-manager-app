/**
 * @file transaction-import-service.ts
 * @description This file contains specialized service functions for transaction import operations.
 * It provides utilities for matching CSV data to existing entities and handling import logic.
 */

import { Account } from '@/types/account'
import { Category } from '@/types/category'
import { Payee } from '@/types/payee'
import { Transaction, TransactionFormData } from '@/types/transaction'
import { formatDateForDatabase } from '@/lib/utils'

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
  createdAccount?: boolean
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
  createMissingAccounts?: boolean
  skipDuplicates?: boolean
  dryRun?: boolean
}

/**
 * Create category via API
 * @description Creates a new category using API route
 * @param displayName - Category display name
 * @returns Promise resolving to created category
 */
async function createCategoryViaAPI(displayName: string): Promise<Category> {
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName, isActive: true })
  })
  
  if (!response.ok) {
    throw new Error('Failed to create category')
  }
  
  const data = await response.json()
  return data.category
}

/**
 * Create payee via API
 * @description Creates a new payee using API route
 * @param displayName - Payee display name
 * @param category - Optional category for the payee
 * @returns Promise resolving to created payee
 */
async function createPayeeViaAPI(displayName: string, category?: string): Promise<Payee> {
  const response = await fetch('/api/payees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName, category, isActive: true })
  })
  
  if (!response.ok) {
    throw new Error('Failed to create payee')
  }
  
  const data = await response.json()
  return data.payee
}

/**
 * Create transaction via API
 * @description Creates a new transaction using API route
 * @param transactionData - Transaction data
 * @returns Promise resolving to created transaction
 */
async function createTransactionViaAPI(transactionData: TransactionFormData): Promise<Transaction> {
  const response = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transactionData)
  })
  
  if (!response.ok) {
    throw new Error('Failed to create transaction')
  }
  
  const data = await response.json()
  return data.transaction
}

/**
 * Create account via API
 * @description Creates a new account using API route
 * @param accountName - Account name
 * @returns Promise resolving to created account
 */
async function createAccountViaAPI(accountName: string): Promise<Account> {
  // Determine account type based on name
  let accountType = 'checking'
  const nameLower = accountName.toLowerCase()
  if (nameLower.includes('savings') || nameLower.includes('saving')) {
    accountType = 'savings'
  } else if (nameLower.includes('credit')) {
    accountType = 'credit_card'
  }

  const response = await fetch('/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: accountName,
      type: accountType,
      status: 'active',
      initialBalance: 0,
      currency: 'INR',
      accountOpeningDate: formatDateForDatabase(new Date()),
      notes: `Auto-created during transaction import`
    })
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to create account: ${errorText}`)
  }
  
  const data = await response.json()
  return data.account
}

/**
 * Find account by name with fuzzy matching
 * @description Matches account name from CSV to existing accounts with case-insensitive and fuzzy matching
 * @param accountName - Account name from CSV
 * @param accounts - Array of existing accounts
 * @returns Account object or null if not found
 */
export function findAccountByName(accountName: string, accounts: Account[]): Account | null {
  if (!accountName) {
    return null
  }
  
  const normalizedName = accountName.toLowerCase().trim()
  
  // Exact match first
  let match = accounts.find(account => 
    account.name.toLowerCase().trim() === normalizedName
  )
  
  if (match) {
    return match
  }
  
  // Partial match (contains)
  match = accounts.find(account => 
    account.name.toLowerCase().trim().includes(normalizedName) ||
    normalizedName.includes(account.name.toLowerCase().trim())
  )
  
  if (match) {
    return match
  }
  
  // Enhanced fuzzy matching for bank names
  const accountWords = normalizedName.split(/\s+/)
  const bankKeywords = ['bank', 'hdfc', 'icici', 'sbi', 'axis', 'kotak', 'yes', 'pnb', 'bob', 'canara', 'union']
  
  let bestMatch: Account | null = null
  let bestScore = 0
  
  for (const account of accounts) {
    const accountNameWords = account.name.toLowerCase().trim().split(/\s+/)
    let score = 0
    
    // Check for specific bank name matches (higher score)
    for (const word of accountWords) {
      if (word.length > 2) {
        for (const accountWord of accountNameWords) {
          if (accountWord.includes(word) || word.includes(accountWord)) {
            // Higher score for bank-specific matches
            if (bankKeywords.includes(word) && bankKeywords.includes(accountWord)) {
              score += 10 // Much higher score for bank name matches
            } else if (word === accountWord) {
              score += 5 // Exact word match
            } else {
              score += 2 // Partial word match
            }
          }
        }
      }
    }
    
    // Bonus score for exact bank name matches
    if (accountWords.includes('hdfc') && accountNameWords.includes('hdfc')) {
      score += 20
    }
    if (accountWords.includes('icici') && accountNameWords.includes('icici')) {
      score += 20
    }
    
    if (score > bestScore && score > 0) {
      bestScore = score
      bestMatch = account
    }
  }
  
  if (bestMatch) {
    return bestMatch
  }

  return null
}

/**
 * Find category by name with fuzzy matching
 * @description Matches category name from CSV to existing categories
 * @param categoryName - Category name from CSV
 * @param categories - Array of existing categories
 * @returns Category object or null if not found
 */
export function findCategoryByName(categoryName: string, categories: Category[]): Category | null {
  if (!categoryName) {
    return null
  }
  
  const normalizedName = categoryName.toLowerCase().trim()
  
  // Check both display name and internal name
  const match = categories.find(category => 
    category.displayName.toLowerCase().trim() === normalizedName ||
    category.name.toLowerCase().trim() === normalizedName
  )
  
  if (match) {
    return match
  }
  
  return null
}

/**
 * Find payee by name with fuzzy matching
 * @description Matches payee name from CSV to existing payees
 * @param payeeName - Payee name from CSV
 * @param payees - Array of existing payees
 * @returns Payee object or null if not found
 */
export function findPayeeByName(payeeName: string, payees: Payee[]): Payee | null {
  if (!payeeName) {
    return null
  }
  
  // Handle transfer transactions (payee starts with '>')
  if (payeeName.startsWith('>')) {
    return null // Transfer transactions don't use payees
  }
  
  const normalizedName = payeeName.toLowerCase().trim()
  
  // Check both display name and internal name
  const match = payees.find(payee => 
    payee.displayName.toLowerCase().trim() === normalizedName ||
    payee.name.toLowerCase().trim() === normalizedName
  )
  
  if (match) {
    return match
  }
  
  return null
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
  
  // Date validation
  if (!transaction.date || isNaN(transaction.date.getTime())) {
    errors.push('Invalid date')
  }
  
  // Account validation
  if (!transaction.account) {
    errors.push('Account is required')
  } else {
    const account = findAccountByName(transaction.account, accounts)
    if (!account) {
      errors.push(`Account "${transaction.account}" not found`)
    }
  }
  
  // Amount validation
  if (transaction.amount <= 0) {
    errors.push('Amount must be greater than 0')
  }
  
  // Transfer validation
  if (transaction.isTransfer) {
    if (!transaction.transferToAccount) {
      errors.push('Transfer destination account is required')
    } else {
      const toAccount = findAccountByName(transaction.transferToAccount, accounts)
      if (!toAccount) {
        errors.push(`Transfer destination account "${transaction.transferToAccount}" not found`)
      }
    }
  } else {
    // Non-transfer validation
    if (!transaction.payee) {
      errors.push('Payee is required for non-transfer transactions')
    }
    
    if (!transaction.category) {
      errors.push('Category is required for non-transfer transactions')
    }
  }
  
  return errors
}

/**
 * Import single transaction
 * @description Imports a single transaction with entity creation if needed
 * @param transaction - Transaction data to import
 * @param accounts - Array of existing accounts
 * @param categories - Array of existing categories
 * @param payees - Array of existing payees
 * @param userId - User ID for the transaction
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
  try {
    // Validate transaction data
    const validationErrors = validateTransactionData(transaction, accounts)
    if (validationErrors.length > 0) {
      return {
        success: false,
        transaction,
        error: validationErrors.join(', ')
      }
    }
    
    // Find or create account
    let account = findAccountByName(transaction.account, accounts)
    let createdAccount = false
    
    if (!account && options.createMissingAccounts) {
      try {
        account = await createAccountViaAPI(transaction.account)
        accounts.push(account) // Add to local array for subsequent transactions
        createdAccount = true
      } catch (error) {
        return {
          success: false,
          transaction,
          error: `Failed to create account "${transaction.account}": ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    }
    
    if (!account) {
      return {
        success: false,
        transaction,
        error: `Account "${transaction.account}" not found and creation is disabled`
      }
    }
    
    let categoryId: string | undefined
    let payeeId: string | undefined
    let createdCategory = false
    let createdPayee = false
    
    if (!transaction.isTransfer) {
      // Handle category
      let category = findCategoryByName(transaction.category, categories)
      if (!category && options.createMissingCategories) {
        try {
          category = await createCategoryViaAPI(transaction.category)
          categories.push(category) // Add to local array for subsequent transactions
          createdCategory = true
        } catch (error) {
          return {
            success: false,
            transaction,
            error: `Failed to create category "${transaction.category}": ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        }
      }
      
      if (!category) {
        return {
          success: false,
          transaction,
          error: `Category "${transaction.category}" not found and creation is disabled`
        }
      }
      
      categoryId = category.id
      
      // Handle payee
      let payee = findPayeeByName(transaction.payee, payees)
      if (!payee && options.createMissingPayees) {
        try {
          payee = await createPayeeViaAPI(transaction.payee, transaction.category)
          payees.push(payee) // Add to local array for subsequent transactions
          createdPayee = true
        } catch (error) {
          return {
            success: false,
            transaction,
            error: `Failed to create payee "${transaction.payee}": ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        }
      }
      
      if (!payee) {
        return {
          success: false,
          transaction,
          error: `Payee "${transaction.payee}" not found and creation is disabled`
        }
      }
      
      payeeId = payee.id
    }
    
    // Prepare transaction data
    let transactionData: TransactionFormData
    let toAccountId: string | undefined
    
    if (transaction.isTransfer) {
      // Find or create destination account for transfer
      let toAccount = findAccountByName(transaction.transferToAccount!, accounts)
      
      if (!toAccount && options.createMissingAccounts) {
        try {
          toAccount = await createAccountViaAPI(transaction.transferToAccount!)
          accounts.push(toAccount) // Add to local array for subsequent transactions
        } catch (error) {
          return {
            success: false,
            transaction,
            error: `Failed to create transfer destination account "${transaction.transferToAccount}": ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        }
      }
      
      if (!toAccount) {
        return {
          success: false,
          transaction,
          error: `Transfer destination account "${transaction.transferToAccount}" not found and creation is disabled`
        }
      }
      
      toAccountId = toAccount.id
      
      transactionData = {
        type: 'transfer',
        fromAccountId: account.id,
        toAccountId: toAccount.id,
        amount: transaction.amount,
        date: transaction.date,
        status: 'completed',
        notes: transaction.notes || undefined
      }
    } else {
      transactionData = {
        type: transaction.type as 'deposit' | 'withdrawal',
        accountId: account.id,
        categoryId: categoryId!,
        payeeId: payeeId!,
        amount: transaction.amount,
        date: transaction.date,
        status: 'completed',
        notes: transaction.notes || undefined
      }
    }
    
    // Create transaction if not dry run
    if (!options.dryRun) {
      await createTransactionViaAPI(transactionData)
    }
    
    const result = {
      success: true,
      transaction,
      createdCategory,
      createdPayee,
      createdAccount,
      accountId: account.id,
      categoryId,
      payeeId,
      fromAccountId: transaction.isTransfer ? account.id : undefined,
      toAccountId: transaction.isTransfer ? toAccountId : undefined
    }
    
    return result
    
  } catch (error) {
    return {
      success: false,
      transaction,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Import transactions in batch
 * @description Imports multiple transactions with progress tracking
 * @param transactions - Array of transactions to import
 * @param accounts - Array of existing accounts
 * @param categories - Array of existing categories
 * @param payees - Array of existing payees
 * @param userId - User ID for the transactions
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
  const total = transactions.length
  
  // Create working copies of arrays to track created entities
  const workingAccounts = [...accounts]
  const workingCategories = [...categories]
  const workingPayees = [...payees]
  
  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i]
    
    try {
      const result = await importSingleTransaction(
        transaction,
        workingAccounts,
        workingCategories,
        workingPayees,
        userId,
        options
      )
      
      results.push(result)
      
      // Update progress
      if (onProgress) {
        onProgress(i + 1, total)
      }
      
      // Add small delay to prevent overwhelming the API
      if (i < transactions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
    } catch (error) {
      results.push({
        success: false,
        transaction,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    }
  }
  
  return results
}

/**
 * Generate import summary
 * @description Creates a summary of import results
 * @param results - Array of import results
 * @returns Import summary object
 */
export function generateImportSummary(results: TransactionImportResult[]) {
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  const createdAccounts = results.filter(r => r.createdAccount).length
  const createdCategories = results.filter(r => r.createdCategory).length
  const createdPayees = results.filter(r => r.createdPayee).length
  
  const errors = results
    .filter(r => !r.success)
    .map(r => r.error)
    .filter(Boolean) as string[]
  
  return {
    total: results.length,
    successful,
    failed,
    createdAccounts,
    createdCategories,
    createdPayees,
    errors: [...new Set(errors)] // Remove duplicates
  }
} 