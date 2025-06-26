/**
 * @file supabase-account-service.ts
 * @description This file contains the Supabase-based account service functions.
 * It provides CRUD operations for accounts using Supabase database.
 */

import { supabase, formatCurrency } from '@/lib/supabase'
import { Account, AccountFormData } from '@/types/account'
import { formatDateForDatabase, parseDateFromDatabase } from '@/lib/utils'

/**
 * Database row interface for accounts table
 * @description Maps to the accounts table structure in Supabase
 */
interface AccountRow {
  id: string
  user_id: string
  name: string
  type: string
  status: string
  initial_balance: number
  current_balance: number
  currency: string
  account_opening_date: string
  notes: string | null
  credit_limit: number | null
  payment_due_date: number | null
  bill_generation_date: number | null
  current_bill_paid: boolean | null
  credit_usage_percentage: number | null
  created_at: string
  updated_at: string
}

/**
 * Transform database row to Account object
 * @description Converts database row format to application Account interface
 * @param row - Database row from accounts table
 * @returns Account object
 */
function transformRowToAccount(row: AccountRow): Account {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type as Account['type'],
    status: row.status as Account['status'],
    initialBalance: row.initial_balance,
    currentBalance: row.current_balance,
    currency: row.currency as Account['currency'],
    accountOpeningDate: parseDateFromDatabase(row.account_opening_date),
    notes: row.notes || undefined,
    creditCardInfo: row.type === 'credit_card' && row.credit_limit && row.payment_due_date && row.bill_generation_date ? {
      creditLimit: row.credit_limit,
      paymentDueDate: row.payment_due_date,
      billGenerationDate: row.bill_generation_date,
      currentBillPaid: row.current_bill_paid || false,
      creditUsagePercentage: row.credit_usage_percentage || 0,
    } : undefined,
    creditUsagePercentage: row.type === 'credit_card' ? (row.credit_usage_percentage || 0) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

/**
 * Transform Account form data to database insert format
 * @description Converts form data to database row format for insertion
 * @param formData - Account form data
 * @param userId - User ID for the account
 * @returns Database insert object
 */
function transformFormDataToRow(formData: AccountFormData, userId: string) {
  return {
    user_id: userId,
    name: formData.name,
    type: formData.type,
    status: formData.status,
    initial_balance: formData.initialBalance,
    current_balance: formData.initialBalance, // Initially same as initial balance
    currency: formData.currency,
    account_opening_date: formatDateForDatabase(formData.accountOpeningDate),
    notes: formData.notes || null,
    credit_limit: formData.type === 'credit_card' ? formData.creditLimit : null,
    payment_due_date: formData.type === 'credit_card' ? formData.paymentDueDate : null,
    bill_generation_date: formData.type === 'credit_card' ? formData.billGenerationDate : null,
    current_bill_paid: formData.type === 'credit_card' ? (formData.currentBillPaid || false) : null,
    credit_usage_percentage: formData.type === 'credit_card' ? (formData.creditUsagePercentage || 0) : null,
  }
}

/**
 * Get all accounts for a user
 * @description Retrieves all accounts belonging to the authenticated user from Supabase, sorted by type first, then alphabetically by name
 * @param userId - User ID to filter accounts
 * @returns Promise resolving to array of accounts
 */
export async function getAccounts(userId: string): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .order('type', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching accounts:', error)
    throw new Error(`Failed to fetch accounts: ${error.message}`)
  }

  return data.map(transformRowToAccount)
}

/**
 * Get account by ID
 * @description Retrieves a specific account by its ID from Supabase
 * @param accountId - Account ID to retrieve
 * @param userId - User ID for authorization
 * @returns Promise resolving to account or null if not found
 */
export async function getAccountById(accountId: string, userId: string): Promise<Account | null> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', accountId)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    console.error('Error fetching account:', error)
    throw new Error(`Failed to fetch account: ${error.message}`)
  }

  return transformRowToAccount(data)
}

/**
 * Create new account
 * @description Creates a new account in Supabase with the provided data
 * @param accountData - Account form data
 * @param userId - User ID for the account owner
 * @returns Promise resolving to the created account
 */
export async function createAccount(accountData: AccountFormData, userId: string): Promise<Account> {
  const insertData = transformFormDataToRow(accountData, userId)

  const { data, error } = await supabase
    .from('accounts')
    .insert([insertData])
    .select()
    .single()

  if (error) {
    console.error('Error creating account:', error)
    throw new Error(`Failed to create account: ${error.message}`)
  }

  return transformRowToAccount(data)
}

/**
 * Update existing account
 * @description Updates an existing account in Supabase with new data
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
  const updateData = {
    name: accountData.name,
    type: accountData.type,
    status: accountData.status,
    initial_balance: accountData.initialBalance,
    currency: accountData.currency,
    account_opening_date: formatDateForDatabase(accountData.accountOpeningDate),
    notes: accountData.notes || null,
    credit_limit: accountData.type === 'credit_card' ? accountData.creditLimit : null,
    payment_due_date: accountData.type === 'credit_card' ? accountData.paymentDueDate : null,
    bill_generation_date: accountData.type === 'credit_card' ? accountData.billGenerationDate : null,
    current_bill_paid: accountData.type === 'credit_card' ? (accountData.currentBillPaid || false) : null,
    credit_usage_percentage: accountData.type === 'credit_card' ? (accountData.creditUsagePercentage || 0) : null,
  }

  const { data, error } = await supabase
    .from('accounts')
    .update(updateData)
    .eq('id', accountId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    console.error('Error updating account:', error)
    throw new Error(`Failed to update account: ${error.message}`)
  }

  return transformRowToAccount(data)
}

/**
 * Delete account
 * @description Deletes an account from Supabase by ID
 * @param accountId - ID of account to delete
 * @param userId - User ID for authorization
 * @returns Promise resolving to boolean indicating success
 */
export async function deleteAccount(accountId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', accountId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting account:', error)
    throw new Error(`Failed to delete account: ${error.message}`)
  }

  return true
}

/**
 * Get account summary statistics
 * @description Calculates summary statistics for user's accounts from Supabase
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

/**
 * Check if user is authenticated
 * @description Helper function to check if user is authenticated
 * @returns Promise resolving to user ID or null
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

/**
 * Recalculate all account balances for a user
 * @description Manually recalculates and updates all account balances based on transactions
 * @param userId - User ID to recalculate balances for
 * @returns Promise resolving to boolean indicating success
 */
export async function recalculateAccountBalances(userId: string): Promise<boolean> {
  try {
    // Call the database function to recalculate balances for all user accounts
    const { error } = await supabase.rpc('recalculate_user_account_balances', {
      user_uuid: userId
    })

    if (error) {
      console.error('Error recalculating account balances:', error)
      throw new Error(`Failed to recalculate account balances: ${error.message}`)
    }

    return true
  } catch (error) {
    console.error('Error in recalculateAccountBalances:', error)
    return false
  }
}

/**
 * Get all accounts with fresh balance calculations
 * @description Retrieves all accounts and ensures balances are up-to-date
 * @param userId - User ID to filter accounts
 * @returns Promise resolving to array of accounts with current balances
 */
export async function getAccountsWithFreshBalances(userId: string): Promise<Account[]> {
  // First recalculate balances to ensure they're current
  await recalculateAccountBalances(userId)
  
  // Then fetch the updated accounts
  return getAccounts(userId)
} 