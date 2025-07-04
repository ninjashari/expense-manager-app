/**
 * @file account-service.ts
 * @description This file contains the PostgreSQL-based account service functions.
 * It provides CRUD operations for accounts using PostgreSQL database.
 */

import { query, queryOne } from '@/lib/database'
import { Account, AccountFormData, AccountApiRequestData } from '@/types/account'
import { formatDateForDatabase, parseDateFromDatabase } from '@/lib/utils'

/**
 * Database row interface for accounts table
 * @description Maps to the accounts table structure in PostgreSQL
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
  account_opening_date: Date | string  // PostgreSQL DATE columns are returned as Date objects by pg driver
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
 * @description Converts database row format to application Account format
 * @param row - Raw database row
 * @returns Formatted Account object
 */
function transformRowToAccount(row: AccountRow): Account {
  const account: Account = {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type as Account['type'],
    status: row.status as Account['status'],
    initialBalance: Number(row.initial_balance) || 0,
    currentBalance: Number(row.current_balance) || 0,
    currency: row.currency as Account['currency'],
    accountOpeningDate: parseDateFromDatabase(row.account_opening_date),
    notes: row.notes || undefined,
    
    // Timestamps
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }

  // Add credit card specific info if applicable
  if (row.type === 'credit_card' && row.credit_limit) {
    account.creditCardInfo = {
      creditLimit: Number(row.credit_limit) || 0,
      paymentDueDate: Number(row.payment_due_date) || 1,
      billGenerationDate: Number(row.bill_generation_date) || 1,
      currentBillPaid: row.current_bill_paid || false,
      creditUsagePercentage: Number(row.credit_usage_percentage) || 0,
    }
    account.creditUsagePercentage = Number(row.credit_usage_percentage) || 0
  }

  return account
}

/**
 * Transform form data to database row format
 * @description Converts AccountFormData or AccountApiRequestData to database insertion format
 * @param formData - Form data from the UI or API request
 * @param userId - User ID for the account owner
 * @returns Database row format
 */
function transformFormDataToRow(formData: AccountFormData | AccountApiRequestData, userId: string) {
  return {
    user_id: userId,
    name: formData.name,
    type: formData.type,
    status: formData.status,
    initial_balance: formData.initialBalance,
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
 * @description Retrieves all accounts belonging to the authenticated user from PostgreSQL, sorted by type first, then alphabetically by name
 * @param userId - User ID to filter accounts
 * @returns Promise resolving to array of accounts
 */
export async function getAccounts(userId: string): Promise<Account[]> {
  try {
    const rows = await query<AccountRow>(`
      SELECT * FROM accounts 
      WHERE user_id = $1 
      ORDER BY type ASC, name ASC
    `, [userId])

    return rows.map(transformRowToAccount)
  } catch (error) {
    console.error('Error fetching accounts:', error)
    throw new Error(`Failed to fetch accounts: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get account by ID
 * @description Retrieves a specific account by its ID from PostgreSQL
 * @param accountId - Account ID to retrieve
 * @param userId - User ID for authorization
 * @returns Promise resolving to account or null if not found
 */
export async function getAccountById(accountId: string, userId: string): Promise<Account | null> {
  try {
    const row = await queryOne<AccountRow>(`
      SELECT * FROM accounts 
      WHERE id = $1 AND user_id = $2
    `, [accountId, userId])

    return row ? transformRowToAccount(row) : null
  } catch (error) {
    console.error('Error fetching account:', error)
    throw new Error(`Failed to fetch account: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create new account
 * @description Creates a new account in PostgreSQL with the provided data
 * @param accountData - Account form data or API request data
 * @param userId - User ID for the account owner
 * @returns Promise resolving to the created account
 */
export async function createAccount(accountData: AccountFormData | AccountApiRequestData, userId: string): Promise<Account> {
  try {
    const insertData = transformFormDataToRow(accountData, userId)
    
    const row = await queryOne<AccountRow>(`
      INSERT INTO accounts (
        user_id, name, type, status, initial_balance, currency, 
        account_opening_date, notes, credit_limit, payment_due_date, 
        bill_generation_date, current_bill_paid, credit_usage_percentage
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      insertData.user_id,
      insertData.name,
      insertData.type,
      insertData.status,
      insertData.initial_balance,
      insertData.currency,
      insertData.account_opening_date,
      insertData.notes,
      insertData.credit_limit,
      insertData.payment_due_date,
      insertData.bill_generation_date,
      insertData.current_bill_paid,
      insertData.credit_usage_percentage,
    ])

    if (!row) {
      throw new Error('Failed to create account')
    }

    return transformRowToAccount(row)
  } catch (error) {
    console.error('Error creating account:', error)
    throw new Error(`Failed to create account: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Update existing account
 * @description Updates an existing account in PostgreSQL with new data
 * @param accountId - ID of account to update
 * @param accountData - Updated account data
 * @param userId - User ID for authorization
 * @returns Promise resolving to updated account or null if not found
 */
export async function updateAccount(
  accountId: string, 
  accountData: AccountFormData | AccountApiRequestData, 
  userId: string
): Promise<Account | null> {
  try {
    const row = await queryOne<AccountRow>(`
      UPDATE accounts 
      SET 
        name = $1,
        type = $2,
        status = $3,
        initial_balance = $4,
        currency = $5,
        account_opening_date = $6,
        notes = $7,
        credit_limit = $8,
        payment_due_date = $9,
        bill_generation_date = $10,
        current_bill_paid = $11,
        credit_usage_percentage = $12,
        updated_at = NOW()
      WHERE id = $13 AND user_id = $14
      RETURNING *
    `, [
      accountData.name,
      accountData.type,
      accountData.status,
      accountData.initialBalance,
      accountData.currency,
      formatDateForDatabase(accountData.accountOpeningDate),
      accountData.notes || null,
      accountData.type === 'credit_card' ? accountData.creditLimit : null,
      accountData.type === 'credit_card' ? accountData.paymentDueDate : null,
      accountData.type === 'credit_card' ? accountData.billGenerationDate : null,
      accountData.type === 'credit_card' ? (accountData.currentBillPaid || false) : null,
      accountData.type === 'credit_card' ? (accountData.creditUsagePercentage || 0) : null,
      accountId,
      userId,
    ])

    return row ? transformRowToAccount(row) : null
  } catch (error) {
    console.error('Error updating account:', error)
    throw new Error(`Failed to update account: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete account
 * @description Deletes an account from PostgreSQL by ID
 * @param accountId - ID of account to delete
 * @param userId - User ID for authorization
 * @returns Promise resolving to boolean indicating success
 */
export async function deleteAccount(accountId: string, userId: string): Promise<boolean> {
  try {
    await query(`
      DELETE FROM accounts 
      WHERE id = $1 AND user_id = $2
    `, [accountId, userId])

    return true
  } catch (error) {
    console.error('Error deleting account:', error)
    throw new Error(`Failed to delete account: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get accounts with fresh balance calculations
 * @description Retrieves accounts and ensures balances are up-to-date by recalculating them
 * @param userId - User ID to filter accounts
 * @returns Promise resolving to array of accounts with fresh balances
 */
export async function getAccountsWithFreshBalances(userId: string): Promise<Account[]> {
  try {
    // First recalculate balances for all user accounts
    await query(`SELECT recalculate_user_account_balances($1)`, [userId])
    
    // Then return the updated accounts
    return getAccounts(userId)
  } catch (error) {
    console.error('Error getting accounts with fresh balances:', error)
    throw new Error(`Failed to get accounts with fresh balances: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Recalculate account balances
 * @description Recalculates and updates the current balances and credit usage for all accounts of a user
 * @param userId - User ID for which to recalculate balances
 * @returns Promise resolving when recalculation is complete
 */
export async function recalculateAccountBalances(userId: string): Promise<void> {
  try {
    // First, try to use the database function if it exists
    try {
      await query(`SELECT recalculate_user_account_balances($1)`, [userId])
    } catch {
      // If the database function doesn't exist, calculate manually
      // Database function not available, calculating manually
      
      // Get all accounts for the user
      const accounts = await query<AccountRow>(`
        SELECT id, initial_balance FROM accounts WHERE user_id = $1
      `, [userId])
      
      // For each account, calculate the balance manually
      for (const account of accounts) {
        const balanceResult = await query<{ transaction_sum: number }>(`
          SELECT COALESCE(
            SUM(
              CASE 
                WHEN type = 'deposit' AND account_id = $1 THEN amount
                WHEN type = 'withdrawal' AND account_id = $1 THEN -amount
                WHEN type = 'transfer' AND to_account_id = $1 THEN amount
                WHEN type = 'transfer' AND from_account_id = $1 THEN -amount
                ELSE 0
              END
            ), 0
          ) as transaction_sum
          FROM transactions 
          WHERE status = 'completed' 
            AND (account_id = $1 OR from_account_id = $1 OR to_account_id = $1)
        `, [account.id])
        
        const transactionSum = balanceResult[0]?.transaction_sum || 0
        const newBalance = account.initial_balance + transactionSum
        
        // Update the account balance
        await query(`
          UPDATE accounts 
          SET current_balance = $1, updated_at = NOW()
          WHERE id = $2
        `, [newBalance, account.id])
      }
    }
  } catch (error) {
    console.error('Error recalculating account balances:', error)
    throw new Error(`Failed to recalculate account balances: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
} 