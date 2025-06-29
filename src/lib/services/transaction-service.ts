/**
 * @file transaction-service.ts
 * @description This file contains the PostgreSQL-based transaction service functions.
 * It provides CRUD operations for transactions using direct PostgreSQL queries.
 * Includes special handling for transfers and automatic category/payee creation.
 */

import { query, queryOne } from '@/lib/database'
import { Transaction, TransactionFormData, isTransferFormData } from '@/types/transaction'
import { formatDateForDatabase, parseDateFromDatabase } from '@/lib/utils'

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
 * Transform database row to Transaction object
 * @description Converts database row format to application Transaction interface
 * @param row - Database row from transactions table
 * @returns Transaction object
 */
function transformRowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    userId: row.user_id,
    date: parseDateFromDatabase(row.date),
    status: row.status,
    type: row.type,
    amount: row.amount,
    accountId: row.account_id || undefined,
    payeeId: row.payee_id || undefined,
    categoryId: row.category_id || undefined,
    fromAccountId: row.from_account_id || undefined,
    toAccountId: row.to_account_id || undefined,
    notes: row.notes || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
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

    return transformRowToTransaction(row)
  } catch (error) {
    console.error('Error creating transaction:', error)
    throw new Error(`Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get transactions for a user
 * @description Retrieves transactions belonging to the authenticated user
 * @param userId - User ID to filter transactions
 * @param limit - Optional limit for number of transactions
 * @param offset - Optional offset for pagination
 * @returns Promise resolving to array of transactions
 */
export async function getTransactions(userId: string, limit?: number, offset?: number): Promise<Transaction[]> {
  try {
    let sql = `
      SELECT * FROM transactions 
      WHERE user_id = $1 
      ORDER BY date DESC, created_at DESC
    `
    const params = [userId]
    
    if (limit) {
      sql += ` LIMIT $${params.length + 1}`
      params.push(limit.toString())
    }
    
    if (offset) {
      sql += ` OFFSET $${params.length + 1}`
      params.push(offset.toString())
    }

    const rows = await query<TransactionRow>(sql, params)
    return rows.map(transformRowToTransaction)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    throw new Error(`Failed to fetch transactions: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get transaction by ID
 * @description Retrieves a specific transaction by ID and user ID
 * @param transactionId - Transaction ID
 * @param userId - User ID for authorization
 * @returns Promise resolving to transaction or null if not found
 */
export async function getTransactionById(transactionId: string, userId: string): Promise<Transaction | null> {
  try {
    const row = await queryOne<TransactionRow>(`
      SELECT * FROM transactions 
      WHERE id = $1 AND user_id = $2
    `, [transactionId, userId])

    return row ? transformRowToTransaction(row) : null
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

    return transformRowToTransaction(row)
  } catch (error) {
    console.error('Error updating transaction:', error)
    throw new Error(`Failed to update transaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
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