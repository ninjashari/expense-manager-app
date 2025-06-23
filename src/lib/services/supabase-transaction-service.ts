/**
 * @file supabase-transaction-service.ts
 * @description This file contains the Supabase-based transaction service functions.
 * It provides CRUD operations for transactions using Supabase database.
 * Includes special handling for transfers and automatic category/payee creation.
 */

import { supabase } from '@/lib/supabase'
import { Transaction, TransactionFormData, isTransferFormData } from '@/types/transaction'
import { createCategory, getCategoryById } from './supabase-category-service'
import { createPayee } from './supabase-payee-service'
import { generateCategoryName } from '@/types/category'
import { generatePayeeName } from '@/types/payee'
import { AccountType } from '@/types/account'
import { formatDateForDatabase, parseDateFromDatabase } from '@/lib/utils'

/**
 * Database row interface for transactions table
 * @description Maps to the transactions table structure in Supabase
 */
interface TransactionRow {
  id: string
  user_id: string
  date: string
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
 * Extended transaction row with joined data
 * @description Transaction row with related account, payee, and category data
 */
interface TransactionRowWithJoins extends TransactionRow {
  account?: {
    id: string
    name: string
    type: AccountType
  } | null
  payee?: {
    id: string
    display_name: string
  } | null
  category?: {
    id: string
    display_name: string
  } | null
  from_account?: {
    id: string
    name: string
    type: AccountType
  } | null
  to_account?: {
    id: string
    name: string
    type: AccountType
  } | null
}

/**
 * Transform database row to Transaction object
 * @description Converts database row format to application Transaction interface
 * @param row - Database row from transactions table with joins
 * @returns Transaction object
 */
function transformRowToTransaction(row: TransactionRowWithJoins): Transaction {
  return {
    id: row.id,
    userId: row.user_id,
    date: parseDateFromDatabase(row.date),
    status: row.status,
    type: row.type,
    amount: row.amount,
    notes: row.notes || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    
    // For deposit/withdrawal transactions
    accountId: row.account_id || undefined,
    account: row.account ? {
      id: row.account.id,
      name: row.account.name,
      type: row.account.type,
      // Add other required Account properties as needed
      userId: row.user_id,
      status: 'active' as const,
      initialBalance: 0,
      currentBalance: 0,
      currency: 'INR' as const,
      accountOpeningDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } : undefined,
    payeeId: row.payee_id || undefined,
    payee: row.payee ? {
      id: row.payee.id,
      displayName: row.payee.display_name,
      // Add other required Payee properties as needed
      userId: row.user_id,
      name: generatePayeeName(row.payee.display_name),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } : undefined,
    categoryId: row.category_id || undefined,
    category: row.category ? {
      id: row.category.id,
      displayName: row.category.display_name,
      // Add other required Category properties as needed
      userId: row.user_id,
      name: generateCategoryName(row.category.display_name),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } : undefined,
    
    // For transfer transactions
    fromAccountId: row.from_account_id || undefined,
    fromAccount: row.from_account ? {
      id: row.from_account.id,
      name: row.from_account.name,
      type: row.from_account.type,
      // Add other required Account properties as needed
      userId: row.user_id,
      status: 'active' as const,
      initialBalance: 0,
      currentBalance: 0,
      currency: 'INR' as const,
      accountOpeningDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } : undefined,
    toAccountId: row.to_account_id || undefined,
    toAccount: row.to_account ? {
      id: row.to_account.id,
      name: row.to_account.name,
      type: row.to_account.type,
      // Add other required Account properties as needed
      userId: row.user_id,
      status: 'active' as const,
      initialBalance: 0,
      currentBalance: 0,
      currency: 'INR' as const,
      accountOpeningDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } : undefined,
  }
}

/**
 * Get all transactions for a user
 * @description Retrieves all transactions belonging to the authenticated user from Supabase
 * @param userId - User ID to filter transactions
 * @returns Promise resolving to array of transactions
 */
export async function getTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      account:accounts!account_id(id, name, type),
      payee:payees!payee_id(id, display_name),
      category:categories!category_id(id, display_name),
      from_account:accounts!from_account_id(id, name, type),
      to_account:accounts!to_account_id(id, name, type)
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching transactions:', error)
    throw new Error(`Failed to fetch transactions: ${error.message}`)
  }

  return data.map(transformRowToTransaction)
}

/**
 * Get transaction by ID
 * @description Retrieves a specific transaction by its ID from Supabase
 * @param transactionId - Transaction ID to retrieve
 * @param userId - User ID for authorization
 * @returns Promise resolving to transaction or null if not found
 */
export async function getTransactionById(transactionId: string, userId: string): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      account:accounts!account_id(id, name, type),
      payee:payees!payee_id(id, display_name),
      category:categories!category_id(id, display_name),
      from_account:accounts!from_account_id(id, name, type),
      to_account:accounts!to_account_id(id, name, type)
    `)
    .eq('id', transactionId)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    console.error('Error fetching transaction:', error)
    throw new Error(`Failed to fetch transaction: ${error.message}`)
  }

  return transformRowToTransaction(data)
}

/**
 * Create new transaction
 * @description Creates a new transaction in Supabase with the provided data
 * Handles creation of new categories and payees if needed
 * @param transactionData - Transaction form data
 * @param userId - User ID for the transaction owner
 * @returns Promise resolving to the created transaction
 */
export async function createTransaction(transactionData: TransactionFormData, userId: string): Promise<Transaction> {
  let finalCategoryId: string | undefined
  let finalCategoryDisplayName: string | undefined
  let finalPayeeId: string | undefined

  // Handle category creation for deposit/withdrawal transactions
  if (!isTransferFormData(transactionData)) {
    // Handle new category creation
    if (transactionData.categoryName && !transactionData.categoryId) {
      try {
        const newCategory = await createCategory({
          displayName: transactionData.categoryName,
          isActive: true,
        }, userId)
        finalCategoryId = newCategory.id
        finalCategoryDisplayName = newCategory.displayName
      } catch (error) {
        // If category already exists, try to find it
        const { data: existingCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('user_id', userId)
          .eq('display_name', transactionData.categoryName)
          .single()
        
        if (existingCategory) {
          finalCategoryId = existingCategory.id
          finalCategoryDisplayName = transactionData.categoryName
        } else {
          throw error
        }
      }
    } else if (transactionData.categoryId) {
      finalCategoryId = transactionData.categoryId
    }

    // Handle new payee creation
    if (transactionData.payeeName && !transactionData.payeeId) {
      if (finalCategoryId && !finalCategoryDisplayName) {
        const category = await getCategoryById(finalCategoryId, userId)
        if (category) {
          finalCategoryDisplayName = category.displayName
        }
      }
      try {
        const newPayee = await createPayee({
          displayName: transactionData.payeeName,
          isActive: true,
          category: finalCategoryDisplayName,
        }, userId)
        finalPayeeId = newPayee.id
      } catch (error) {
        // If payee already exists, try to find it
        const { data: existingPayee } = await supabase
          .from('payees')
          .select('id')
          .eq('user_id', userId)
          .eq('display_name', transactionData.payeeName)
          .single()
        
        if (existingPayee) {
          finalPayeeId = existingPayee.id
        } else {
          throw error
        }
      }
    } else if (transactionData.payeeId) {
      finalPayeeId = transactionData.payeeId
    }
  }

  // Prepare transaction data for insertion
  const insertData = isTransferFormData(transactionData) ? {
    user_id: userId,
    date: formatDateForDatabase(transactionData.date),
    status: transactionData.status,
    type: transactionData.type,
    amount: transactionData.amount,
    from_account_id: transactionData.fromAccountId,
    to_account_id: transactionData.toAccountId,
    notes: transactionData.notes || null,
    account_id: null,
    payee_id: null,
    category_id: null,
  } : {
    user_id: userId,
    date: formatDateForDatabase(transactionData.date),
    status: transactionData.status,
    type: transactionData.type,
    amount: transactionData.amount,
    account_id: transactionData.accountId,
    payee_id: finalPayeeId || null,
    category_id: finalCategoryId || null,
    notes: transactionData.notes || null,
    from_account_id: null,
    to_account_id: null,
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert([insertData])
    .select(`
      *,
      account:accounts!account_id(id, name, type),
      payee:payees!payee_id(id, display_name),
      category:categories!category_id(id, display_name),
      from_account:accounts!from_account_id(id, name, type),
      to_account:accounts!to_account_id(id, name, type)
    `)
    .single()

  if (error) {
    console.error('Error creating transaction:', error)
    throw new Error(`Failed to create transaction: ${error.message}`)
  }

  return transformRowToTransaction(data)
}

/**
 * Update existing transaction
 * @description Updates an existing transaction in Supabase with new data
 * @param transactionId - Transaction ID to update
 * @param transactionData - Updated transaction data
 * @param userId - User ID for authorization
 * @returns Promise resolving to the updated transaction or null if not found
 */
export async function updateTransaction(
  transactionId: string,
  transactionData: TransactionFormData,
  userId: string
): Promise<Transaction | null> {
  let finalCategoryId: string | undefined
  let finalCategoryDisplayName: string | undefined
  let finalPayeeId: string | undefined

  // Handle category creation for deposit/withdrawal transactions
  if (!isTransferFormData(transactionData)) {
    // Handle new category creation
    if (transactionData.categoryName && !transactionData.categoryId) {
      try {
        const newCategory = await createCategory({
          displayName: transactionData.categoryName,
          isActive: true,
        }, userId)
        finalCategoryId = newCategory.id
        finalCategoryDisplayName = newCategory.displayName
      } catch (error) {
        // If category already exists, try to find it
        const { data: existingCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('user_id', userId)
          .eq('display_name', transactionData.categoryName)
          .single()
        
        if (existingCategory) {
          finalCategoryId = existingCategory.id
          finalCategoryDisplayName = transactionData.categoryName
        } else {
          throw error
        }
      }
    } else if (transactionData.categoryId) {
      finalCategoryId = transactionData.categoryId
    }

    // Handle new payee creation
    if (transactionData.payeeName && !transactionData.payeeId) {
      if (finalCategoryId && !finalCategoryDisplayName) {
        const category = await getCategoryById(finalCategoryId, userId)
        if (category) {
          finalCategoryDisplayName = category.displayName
        }
      }
      try {
        const newPayee = await createPayee({
          displayName: transactionData.payeeName,
          isActive: true,
          category: finalCategoryDisplayName,
        }, userId)
        finalPayeeId = newPayee.id
      } catch (error) {
        // If payee already exists, try to find it
        const { data: existingPayee } = await supabase
          .from('payees')
          .select('id')
          .eq('user_id', userId)
          .eq('display_name', transactionData.payeeName)
          .single()
        
        if (existingPayee) {
          finalPayeeId = existingPayee.id
        } else {
          throw error
        }
      }
    } else if (transactionData.payeeId) {
      finalPayeeId = transactionData.payeeId
    }
  }

  // Prepare transaction data for update
  const updateData = isTransferFormData(transactionData) ? {
    date: formatDateForDatabase(transactionData.date),
    status: transactionData.status,
    type: transactionData.type,
    amount: transactionData.amount,
    from_account_id: transactionData.fromAccountId,
    to_account_id: transactionData.toAccountId,
    notes: transactionData.notes || null,
    account_id: null,
    payee_id: null,
    category_id: null,
  } : {
    date: formatDateForDatabase(transactionData.date),
    status: transactionData.status,
    type: transactionData.type,
    amount: transactionData.amount,
    account_id: transactionData.accountId,
    payee_id: finalPayeeId || null,
    category_id: finalCategoryId || null,
    notes: transactionData.notes || null,
    from_account_id: null,
    to_account_id: null,
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', transactionId)
    .eq('user_id', userId)
    .select(`
      *,
      account:accounts!account_id(id, name, type),
      payee:payees!payee_id(id, display_name),
      category:categories!category_id(id, display_name),
      from_account:accounts!from_account_id(id, name, type),
      to_account:accounts!to_account_id(id, name, type)
    `)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    console.error('Error updating transaction:', error)
    throw new Error(`Failed to update transaction: ${error.message}`)
  }

  return transformRowToTransaction(data)
}

/**
 * Delete transaction
 * @description Deletes a transaction from Supabase
 * @param transactionId - Transaction ID to delete
 * @param userId - User ID for authorization
 * @returns Promise resolving to boolean indicating success
 */
export async function deleteTransaction(transactionId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting transaction:', error)
    throw new Error(`Failed to delete transaction: ${error.message}`)
  }

  return true
}

/**
 * Get transactions by account
 * @description Retrieves transactions for a specific account
 * @param accountId - Account ID to filter by
 * @param userId - User ID for authorization
 * @returns Promise resolving to array of transactions
 */
export async function getTransactionsByAccount(accountId: string, userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      account:accounts!account_id(id, name, type),
      payee:payees!payee_id(id, display_name),
      category:categories!category_id(id, display_name),
      from_account:accounts!from_account_id(id, name, type),
      to_account:accounts!to_account_id(id, name, type)
    `)
    .eq('user_id', userId)
    .or(`account_id.eq.${accountId},from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching transactions by account:', error)
    throw new Error(`Failed to fetch transactions by account: ${error.message}`)
  }

  return data.map(transformRowToTransaction)
}

/**
 * Get current user ID from Supabase auth
 * @description Retrieves the current authenticated user's ID
 * @returns Promise resolving to user ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
} 