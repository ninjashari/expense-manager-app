/**
 * @file transaction-service.ts
 * @description This file contains the PostgreSQL-based transaction service functions.
 * It provides CRUD operations for transactions using direct PostgreSQL queries.
 * Includes special handling for transfers and automatic category/payee creation.
 */

import { query, queryOne } from '@/lib/database'
import { Transaction, TransactionFormData, isTransferFormData } from '@/types/transaction'
import { AccountType, Currency } from '@/types/account'
import { formatDateForDatabase, parseDateFromDatabase } from '@/lib/utils'
import {
  ReportFilters,
  getDateRangeFromPreset,
} from '@/types/report'

/**
 * Database row interface for transactions table
 * @description Maps to the transactions table structure in PostgreSQL
 */
interface TransactionRow {
  id: string
  user_id: string
  date: Date | string  // PostgreSQL DATE columns are returned as Date objects by pg driver
  status: 'pending' | 'completed' | 'cancelled'
  type: 'deposit' | 'withdrawal' | 'transfer'
  amount: number
  account_id: string | null
  payee_id: string | null
  category_id: string | null
  from_account_id: string | null
  to_account_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

/**
 * Interface for transaction database operations
 * @description Structure for insert/update operations
 */
interface TransactionData {
  user_id?: string
  date: string
  status: string
  type?: string
  amount: number
  account_id?: string | null
  payee_id?: string | null
  category_id?: string | null
  from_account_id?: string | null
  to_account_id?: string | null
  notes: string | null
}

/**
 * Extended transaction row interface with joined relation data
 * @description Database row with LEFT JOIN data from related tables
 */
interface TransactionRowWithRelations extends TransactionRow {
  account_name?: string
  account_type?: AccountType
  account_currency?: Currency
  from_account_name?: string
  from_account_type?: AccountType
  from_account_currency?: Currency
  to_account_name?: string
  to_account_type?: AccountType
  to_account_currency?: Currency
  payee_display_name?: string
  payee_category?: string
  category_display_name?: string
  category_description?: string
}

/**
 * Transform database row with relations to Transaction object
 * @description Converts joined database row to Transaction with related entities
 * @param row - Database row with joined data
 * @returns Transaction object with populated relations
 */
function transformRowToTransactionWithRelations(row: TransactionRowWithRelations): Transaction {
  const transaction: Transaction = {
    id: row.id,
    userId: row.user_id,
    date: parseDateFromDatabase(row.date),
    status: row.status,
    type: row.type,
    amount: Number(row.amount) || 0,
    accountId: row.account_id || undefined,
    payeeId: row.payee_id || undefined,
    categoryId: row.category_id || undefined,
    fromAccountId: row.from_account_id || undefined,
    toAccountId: row.to_account_id || undefined,
    notes: row.notes || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }

  // Populate account relation
  if (row.account_id && row.account_name) {
    transaction.account = {
      id: row.account_id,
      name: row.account_name,
      type: row.account_type || 'checking',
      currency: row.account_currency || 'INR',
      // Add other required account properties with defaults
      userId: row.user_id,
      status: 'active',
      initialBalance: 0,
      currentBalance: 0,
      accountOpeningDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  // Populate fromAccount relation (for transfers)
  if (row.from_account_id && row.from_account_name) {
    transaction.fromAccount = {
      id: row.from_account_id,
      name: row.from_account_name,
      type: row.from_account_type || 'checking',
      currency: row.from_account_currency || 'INR',
      // Add other required account properties with defaults
      userId: row.user_id,
      status: 'active',
      initialBalance: 0,
      currentBalance: 0,
      accountOpeningDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  // Populate toAccount relation (for transfers)
  if (row.to_account_id && row.to_account_name) {
    transaction.toAccount = {
      id: row.to_account_id,
      name: row.to_account_name,
      type: row.to_account_type || 'checking',
      currency: row.to_account_currency || 'INR',
      // Add other required account properties with defaults
      userId: row.user_id,
      status: 'active',
      initialBalance: 0,
      currentBalance: 0,
      accountOpeningDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  // Populate payee relation
  if (row.payee_id && row.payee_display_name) {
    transaction.payee = {
      id: row.payee_id,
      displayName: row.payee_display_name,
      category: row.payee_category,
      // Add other required payee properties with defaults
      userId: row.user_id,
      name: row.payee_display_name.toLowerCase().replace(/\s+/g, '-'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  // Populate category relation
  if (row.category_id && row.category_display_name) {
    transaction.category = {
      id: row.category_id,
      displayName: row.category_display_name,
      description: row.category_description,
      // Add other required category properties with defaults
      userId: row.user_id,
      name: row.category_display_name.toLowerCase().replace(/\s+/g, '-'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  return transaction
}

/**
 * Create new transaction
 * @description Creates a new transaction with the provided data
 * @param transactionData - Transaction form data
 * @param userId - User ID for the transaction owner
 * @returns Promise resolving to the created transaction
 */
export async function createTransaction(transactionData: TransactionFormData, userId: string): Promise<Transaction> {
  try {
    // Determine transaction type and prepare data
    let insertData: TransactionData = {
      user_id: userId,
      date: formatDateForDatabase(transactionData.date),
      status: transactionData.status || 'completed',
      amount: transactionData.amount,
      notes: transactionData.notes || null,
    }

    if (isTransferFormData(transactionData)) {
      // Handle transfer transaction
      insertData = {
        ...insertData,
        type: 'transfer',
        from_account_id: transactionData.fromAccountId,
        to_account_id: transactionData.toAccountId,
        account_id: null,
        payee_id: null,
        category_id: null,
      }
    } else {
      // Handle regular transaction
      insertData = {
        ...insertData,
        type: transactionData.type,
        account_id: transactionData.accountId,
        payee_id: transactionData.payeeId || null,
        category_id: transactionData.categoryId || null,
        from_account_id: null,
        to_account_id: null,
      }
    }

    const row = await queryOne<TransactionRow>(`
      INSERT INTO transactions (
        user_id, date, status, type, amount, account_id, payee_id, category_id,
        from_account_id, to_account_id, notes, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *
    `, [
      insertData.user_id,
      insertData.date,
      insertData.status,
      insertData.type,
      insertData.amount,
      insertData.account_id,
      insertData.payee_id,
      insertData.category_id,
      insertData.from_account_id,
      insertData.to_account_id,
      insertData.notes
    ])

    if (!row) {
      throw new Error('Failed to create transaction')
    }

    // Fetch the complete transaction with related data
    const completeTransaction = await getTransactionById(row.id, userId)
    if (!completeTransaction) {
      throw new Error('Failed to fetch created transaction with relations')
    }

    return completeTransaction
  } catch (error) {
    console.error('Error creating transaction:', error)
    throw new Error(`Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get transactions for a user with related data
 * @description Retrieves transactions with joined account, payee, and category data
 * @param userId - User ID to filter transactions
 * @param limit - Optional limit for number of transactions
 * @param offset - Optional query offset for pagination
 * @param filters - Optional filters for filtering transactions
 * @returns Promise resolving to an array of transactions
 */
export async function getTransactions(
  userId: string,
  limit?: number,
  offset?: number,
  filters?: ReportFilters
): Promise<Transaction[]> {
  try {
    const whereClauses: string[] = ['t.user_id = $1']
    const queryParams: (string | number | string[])[] = [userId]
    let paramIndex = 2

    if (filters) {
      if (filters.accountIds && filters.accountIds.length > 0) {
        whereClauses.push(`(t.account_id = ANY($${paramIndex}) OR t.from_account_id = ANY($${paramIndex}) OR t.to_account_id = ANY($${paramIndex}))`)
        queryParams.push(filters.accountIds)
        paramIndex++
      }
      if (filters.categoryIds && filters.categoryIds.length > 0) {
        whereClauses.push(`t.category_id = ANY($${paramIndex})`)
        queryParams.push(filters.categoryIds)
        paramIndex++
      }
      if (filters.payeeIds && filters.payeeIds.length > 0) {
        whereClauses.push(`t.payee_id = ANY($${paramIndex})`)
        queryParams.push(filters.payeeIds)
        paramIndex++
      }
      if (filters.transactionTypes && filters.transactionTypes.length > 0) {
        whereClauses.push(`t.type = ANY($${paramIndex})`)
        queryParams.push(filters.transactionTypes)
        paramIndex++
      }
      if (filters.transactionStatuses && filters.transactionStatuses.length > 0) {
        whereClauses.push(`t.status = ANY($${paramIndex})`)
        queryParams.push(filters.transactionStatuses)
        paramIndex++
      }
      if (filters.minAmount !== undefined) {
        whereClauses.push(`t.amount >= $${paramIndex}`)
        queryParams.push(filters.minAmount)
        paramIndex++
      }
      if (filters.maxAmount !== undefined) {
        whereClauses.push(`t.amount <= $${paramIndex}`)
        queryParams.push(filters.maxAmount)
        paramIndex++
      }
      if (filters.dateRangePreset) {
        const dateRange = getDateRangeFromPreset(filters.dateRangePreset)
        if (dateRange) {
          whereClauses.push(`t.date BETWEEN $${paramIndex} AND $${paramIndex + 1}`)
          queryParams.push(formatDateForDatabase(dateRange.start), formatDateForDatabase(dateRange.end))
          paramIndex += 2
        }
      }
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const limitClause = limit ? `LIMIT $${paramIndex}` : ''
    if (limit) queryParams.push(limit)
    
    const offsetClause = offset ? `OFFSET $${paramIndex + (limit ? 1 : 0)}` : ''
    if (offset) queryParams.push(offset)

    const rows = await query<TransactionRowWithRelations>(`
      SELECT 
        t.*,
        -- Account data
        a.name as account_name,
        a.type as account_type,
        a.currency as account_currency,
        -- From account data (for transfers)
        fa.name as from_account_name,
        fa.type as from_account_type,
        fa.currency as from_account_currency,
        -- To account data (for transfers)
        ta.name as to_account_name,
        ta.type as to_account_type,
        ta.currency as to_account_currency,
        -- Payee data
        p.display_name as payee_display_name,
        p.category as payee_category,
        -- Category data
        c.display_name as category_display_name,
        c.description as category_description
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN accounts fa ON t.from_account_id = fa.id
      LEFT JOIN accounts ta ON t.to_account_id = ta.id
      LEFT JOIN payees p ON t.payee_id = p.id
      LEFT JOIN categories c ON t.category_id = c.id
      ${whereString}
      ORDER BY t.date DESC
      ${limitClause}
      ${offsetClause}
    `, queryParams)
    
    return rows.map(transformRowToTransactionWithRelations)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    throw new Error(`Failed to fetch transactions: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get transaction by ID with related data
 * @description Retrieves a specific transaction by ID with joined account, payee, and category data
 * @param transactionId - Transaction ID
 * @param userId - User ID for authorization
 * @returns Promise resolving to transaction with related data or null if not found
 */
export async function getTransactionById(transactionId: string, userId: string): Promise<Transaction | null> {
  try {
    const row = await queryOne<TransactionRowWithRelations>(`
      SELECT 
        t.*,
        -- Account data
        a.name as account_name,
        a.type as account_type,
        a.currency as account_currency,
        -- From account data (for transfers)
        fa.name as from_account_name,
        fa.type as from_account_type,
        fa.currency as from_account_currency,
        -- To account data (for transfers)
        ta.name as to_account_name,
        ta.type as to_account_type,
        ta.currency as to_account_currency,
        -- Payee data
        p.display_name as payee_display_name,
        p.category as payee_category,
        -- Category data
        c.display_name as category_display_name,
        c.description as category_description
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN accounts fa ON t.from_account_id = fa.id
      LEFT JOIN accounts ta ON t.to_account_id = ta.id
      LEFT JOIN payees p ON t.payee_id = p.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = $1 AND t.user_id = $2
    `, [transactionId, userId])

    return row ? transformRowToTransactionWithRelations(row) : null
  } catch (error) {
    console.error('Error fetching transaction by ID:', error)
    throw new Error(`Failed to fetch transaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Update transaction
 * @description Updates an existing transaction with new data
 * @param transactionId - ID of transaction to update
 * @param transactionData - Updated transaction form data
 * @param userId - User ID for authorization
 * @returns Promise resolving to the updated transaction
 */
export async function updateTransaction(transactionId: string, transactionData: TransactionFormData, userId: string): Promise<Transaction> {
  try {
    // Prepare update data similar to create
    let updateData: Partial<TransactionData> = {
      date: formatDateForDatabase(transactionData.date),
      status: transactionData.status || 'completed',
      amount: transactionData.amount,
      notes: transactionData.notes || null,
    }

    if (isTransferFormData(transactionData)) {
      updateData = {
        ...updateData,
        type: 'transfer',
        from_account_id: transactionData.fromAccountId,
        to_account_id: transactionData.toAccountId,
        account_id: null,
        payee_id: null,
        category_id: null,
      }
    } else {
      updateData = {
        ...updateData,
        type: transactionData.type,
        account_id: transactionData.accountId,
        payee_id: transactionData.payeeId || null,
        category_id: transactionData.categoryId || null,
        from_account_id: null,
        to_account_id: null,
      }
    }

    const row = await queryOne<TransactionRow>(`
      UPDATE transactions 
      SET date = $3, status = $4, type = $5, amount = $6, account_id = $7, payee_id = $8, 
          category_id = $9, from_account_id = $10, to_account_id = $11, notes = $12, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [
      transactionId,
      userId,
      updateData.date,
      updateData.status,
      updateData.type,
      updateData.amount,
      updateData.account_id,
      updateData.payee_id,
      updateData.category_id,
      updateData.from_account_id,
      updateData.to_account_id,
      updateData.notes
    ])

    if (!row) {
      throw new Error('Transaction not found or you do not have permission to update it')
    }

    // Fetch the complete transaction with related data
    const completeTransaction = await getTransactionById(transactionId, userId)
    if (!completeTransaction) {
      throw new Error('Failed to fetch updated transaction with relations')
    }

    return completeTransaction
  } catch (error) {
    console.error('Error updating transaction:', error)
    throw new Error(`Failed to update transaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get first transaction date for an account
 * @description Gets the date of the first transaction for a specific account
 * @param accountId - Account ID
 * @param userId - User ID for authorization
 * @returns Promise resolving to the first transaction date or null if no transactions
 */
export async function getFirstTransactionDateForAccount(accountId: string, userId: string): Promise<Date | null> {
  try {
    const row = await queryOne<{ date: string }>(`
      SELECT MIN(date) as date
      FROM transactions 
      WHERE account_id = $1 AND user_id = $2
    `, [accountId, userId])

    return row ? new Date(row.date) : null
  } catch (error) {
    console.error('Error fetching first transaction date for account:', error)
    throw new Error(`Failed to fetch first transaction date: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete transaction
 * @description Deletes a transaction
 * @param transactionId - ID of transaction to delete
 * @param userId - User ID for authorization
 * @returns Promise resolving to boolean indicating success
 */
export async function deleteTransaction(transactionId: string, userId: string): Promise<boolean> {
  try {
    const result = await query(`
      DELETE FROM transactions 
      WHERE id = $1 AND user_id = $2
    `, [transactionId, userId])

    return Array.isArray(result) && result.length > 0
  } catch (error) {
    console.error('Error deleting transaction:', error)
    throw new Error(`Failed to delete transaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
} 