/**
 * @file account-service.ts
 * @description This file contains the service layer for account management.
 * Currently uses mock data to simulate database operations.
 * Will be replaced with actual Supabase integration later.
 */
import { Account, AccountFormData } from '@/types/account'
import { formatCurrency } from '@/lib/supabase'

/**
 * Mock accounts data
 * @description Sample accounts for demonstration purposes
 */
const mockAccounts: Account[] = [
  {
    id: '1',
    userId: 'user-1',
    name: 'HDFC Savings Account',
    type: 'savings',
    status: 'active',
    initialBalance: 50000,
    currentBalance: 75000,
    currency: 'INR',
    accountOpeningDate: new Date('2020-01-15'),
    notes: 'Primary savings account with HDFC Bank',
    createdAt: new Date('2020-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    userId: 'user-1',
    name: 'ICICI Credit Card',
    type: 'credit_card',
    status: 'active',
    initialBalance: 0,
    currentBalance: -15000,
    currency: 'INR',
    accountOpeningDate: new Date('2021-06-10'),
    notes: 'Amazon Pay ICICI Credit Card',
    creditCardInfo: {
      creditLimit: 200000,
      paymentDueDate: 15,
      billGenerationDate: 20,
    },
    createdAt: new Date('2021-06-10'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '3',
    userId: 'user-1',
    name: 'Cash Wallet',
    type: 'cash',
    status: 'active',
    initialBalance: 5000,
    currentBalance: 3500,
    currency: 'INR',
    accountOpeningDate: new Date('2024-01-01'),
    notes: 'Physical cash and wallet money',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
]

// Create a mutable copy for operations
const accountsData = [...mockAccounts]

/**
 * Get all accounts for a user
 * @description Retrieves all accounts belonging to the authenticated user
 * @param userId - User ID to filter accounts
 * @returns Promise resolving to array of accounts
 */
export async function getAccounts(userId: string): Promise<Account[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return accountsData.filter(account => account.userId === userId)
}

/**
 * Get account by ID
 * @description Retrieves a specific account by its ID
 * @param accountId - Account ID to retrieve
 * @param userId - User ID for authorization
 * @returns Promise resolving to account or null if not found
 */
export async function getAccountById(accountId: string, userId: string): Promise<Account | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const account = accountsData.find(acc => acc.id === accountId && acc.userId === userId)
  return account || null
}

/**
 * Create new account
 * @description Creates a new account with the provided data
 * @param accountData - Account form data
 * @param userId - User ID for the account owner
 * @returns Promise resolving to the created account
 */
export async function createAccount(accountData: AccountFormData, userId: string): Promise<Account> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800))
  
  const newAccount: Account = {
    id: `account-${Date.now()}`,
    userId,
    name: accountData.name,
    type: accountData.type,
    status: accountData.status,
    initialBalance: accountData.initialBalance,
    currentBalance: accountData.initialBalance, // Initially same as initial balance
    currency: accountData.currency,
    accountOpeningDate: accountData.accountOpeningDate,
    notes: accountData.notes,
    creditCardInfo: accountData.type === 'credit_card' ? {
      creditLimit: accountData.creditLimit!,
      paymentDueDate: accountData.paymentDueDate!,
      billGenerationDate: accountData.billGenerationDate!,
    } : undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  
  accountsData.push(newAccount)
  return newAccount
}

/**
 * Update existing account
 * @description Updates an existing account with new data
 * @param accountId - ID of account to update
 * @param accountData - Updated account data
 * @param userId - User ID for authorization
 * @returns Promise resolving to updated account or null if not found
 */
export async function updateAccount(
  accountId: string, 
  accountData: AccountFormData, 
  userId: string
): Promise<Account | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600))
  
  const accountIndex = accountsData.findIndex(acc => acc.id === accountId && acc.userId === userId)
  
  if (accountIndex === -1) {
    return null
  }
  
  const existingAccount = accountsData[accountIndex]
  const updatedAccount: Account = {
    ...existingAccount,
    name: accountData.name,
    type: accountData.type,
    status: accountData.status,
    initialBalance: accountData.initialBalance,
    currency: accountData.currency,
    accountOpeningDate: accountData.accountOpeningDate,
    notes: accountData.notes,
    creditCardInfo: accountData.type === 'credit_card' ? {
      creditLimit: accountData.creditLimit!,
      paymentDueDate: accountData.paymentDueDate!,
      billGenerationDate: accountData.billGenerationDate!,
    } : undefined,
    updatedAt: new Date(),
  }
  
  accountsData[accountIndex] = updatedAccount
  return updatedAccount
}

/**
 * Delete account
 * @description Deletes an account by ID
 * @param accountId - ID of account to delete
 * @param userId - User ID for authorization
 * @returns Promise resolving to boolean indicating success
 */
export async function deleteAccount(accountId: string, userId: string): Promise<boolean> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400))
  
  const accountIndex = accountsData.findIndex(acc => acc.id === accountId && acc.userId === userId)
  
  if (accountIndex === -1) {
    return false
  }
  
  accountsData.splice(accountIndex, 1)
  return true
}

/**
 * Get account summary statistics
 * @description Calculates summary statistics for user's accounts
 * @param userId - User ID to calculate stats for
 * @returns Promise resolving to account statistics
 */
export async function getAccountSummary(userId: string) {
  const accounts = await getAccounts(userId)
  
  const summary = {
    totalAccounts: accounts.length,
    activeAccounts: accounts.filter(acc => acc.status === 'active').length,
    totalBalance: accounts.reduce((sum, acc) => sum + acc.currentBalance, 0),
    totalAssets: accounts
      .filter(acc => acc.currentBalance > 0)
      .reduce((sum, acc) => sum + acc.currentBalance, 0),
    totalLiabilities: Math.abs(accounts
      .filter(acc => acc.currentBalance < 0)
      .reduce((sum, acc) => sum + acc.currentBalance, 0)),
    accountsByType: accounts.reduce((acc, account) => {
      acc[account.type] = (acc[account.type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
  }
  
  return summary
}

/**
 * Format account balance with currency
 * @description Formats account balance with appropriate currency symbol
 * @param account - Account object
 * @returns Formatted balance string
 */
export function formatAccountBalance(account: Account): string {
  if (account.currency === 'INR') {
    return formatCurrency(account.currentBalance)
  }
  
  // For other currencies, use basic formatting
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: account.currency,
  })
  
  return formatter.format(account.currentBalance)
} 