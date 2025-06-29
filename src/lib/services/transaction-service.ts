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
 * Transform database row with relations to Transaction object
 * @description Converts joined database row to Transaction with related entities
 * @param row - Database row with joined data
 * @returns Transaction object with populated relations
 */
function transformRowToTransactionWithRelations(row: TransactionRow & {
  account_name?: string
  account_type?: string
  account_currency?: string
  from_account_name?: string
  from_account_type?: string
  from_account_currency?: string
  to_account_name?: string
  to_account_type?: string
  to_account_currency?: string
  payee_display_name?: string
  payee_category?: string
  category_display_name?: string
  category_description?: string
}): Transaction {
  const transaction: Transaction = {
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

  // Populate account relation
  if (row.account_id && row.account_name) {
    transaction.account = {
      id: row.account_id,
      name: row.account_name,
      type: (row.account_type as any) || 'checking',
      currency: (row.account_currency as any) || 'INR',
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
      type: (row.from_account_type as any) || 'checking',
      currency: (row.from_account_currency as any) || 'INR',
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
      type: (row.to_account_type as any) || 'checking',
      currency: (row.to_account_currency as any) || 'INR',
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

    return transformRowToTransaction(row)
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
 * @param offset - Optional offset for pagination
 * @returns Promise resolving to array of transactions with related data
 */
export async function getTransactions(userId: string, limit?: number, offset?: number): Promise<Transaction[]> {
  try {
    let sql = `
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
      WHERE t.user_id = $1 
      ORDER BY t.date DESC, t.created_at DESC
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

    const rows = await query<any>(sql, params)
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
    const row = await queryOne<any>(`
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