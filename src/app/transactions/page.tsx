/**
 * @file page.tsx
 * @description This file defines the transactions page of the expense management application.
 * It provides full CRUD functionality for managing transactions with support for deposits, withdrawals, and transfers.
 */

"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { TransactionForm } from "@/components/transactions/transaction-form"
import { TransactionsList } from "@/components/transactions/transactions-list"

import { Transaction, TransactionFormData } from "@/types/transaction"
import { Account } from "@/types/account"
import { Category } from "@/types/category"
import { Payee } from "@/types/payee"

import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getCurrentUserId
} from "@/lib/services/supabase-transaction-service"
import { getAccounts } from "@/lib/services/supabase-account-service"
import { getActiveCategories } from "@/lib/services/supabase-category-service"
import { getActivePayees } from "@/lib/services/supabase-payee-service"

/**
 * TransactionsPage component
 * @description Renders the transactions management page with full CRUD functionality
 * @returns JSX element containing the transactions page content
 */
export default function TransactionsPage() {
  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [payees, setPayees] = useState<Payee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  /**
   * Load user ID on component mount
   * @description Gets the current authenticated user's ID
   */
  useEffect(() => {
    const loadUserId = async () => {
      try {
        const id = await getCurrentUserId()
        setUserId(id)
      } catch (error) {
        console.error('Error loading user ID:', error)
        toast.error('Failed to authenticate user')
      }
    }
    
    loadUserId()
  }, [])

  /**
   * Load all required data when user ID is available
   * @description Loads transactions, accounts, categories, and payees
   */
  useEffect(() => {
    if (!userId) return

    const loadData = async () => {
      setIsLoading(true)
      try {
        const [
          transactionsData,
          accountsData,
          categoriesData,
          payeesData
        ] = await Promise.all([
          getTransactions(userId),
          getAccounts(userId),
          getActiveCategories(userId),
          getActivePayees(userId)
        ])

        setTransactions(transactionsData)
        setAccounts(accountsData)
        setCategories(categoriesData)
        setPayees(payeesData)
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Failed to load transactions data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [userId])

  /**
   * Handle form submission for creating or updating transactions
   * @description Processes form data and calls appropriate service function
   * @param formData - Transaction form data
   */
  const handleSubmit = async (formData: TransactionFormData) => {
    if (!userId) {
      toast.error('User not authenticated')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingTransaction) {
        // Update existing transaction
        const updatedTransaction = await updateTransaction(
          editingTransaction.id,
          formData,
          userId
        )
        
        if (updatedTransaction) {
          setTransactions(prev => prev.map(t => 
            t.id === editingTransaction.id ? updatedTransaction : t
          ))
          toast.success('Transaction updated successfully')
        } else {
          toast.error('Transaction not found')
        }
      } else {
        // Create new transaction
        const newTransaction = await createTransaction(formData, userId)
        setTransactions(prev => [newTransaction, ...prev])
        toast.success('Transaction created successfully')
      }

      // Close form and reset state
      setShowForm(false)
      setEditingTransaction(null)
    } catch (error) {
      console.error('Error submitting transaction:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Failed to ${editingTransaction ? 'update' : 'create'} transaction: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle transaction editing
   * @description Opens form with transaction data for editing
   * @param transaction - Transaction to edit
   */
  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setShowForm(true)
  }

  /**
   * Handle transaction deletion
   * @description Deletes a transaction with confirmation
   * @param transaction - Transaction to delete
   */
  const handleDelete = async (transaction: Transaction) => {
    if (!userId) {
      toast.error('User not authenticated')
      return
    }

    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      return
    }

    try {
      await deleteTransaction(transaction.id, userId)
      setTransactions(prev => prev.filter(t => t.id !== transaction.id))
      toast.success('Transaction deleted successfully')
    } catch (error) {
      console.error('Error deleting transaction:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Failed to delete transaction: ${errorMessage}`)
    }
  }

  /**
   * Handle form cancellation
   * @description Closes form and resets state
   */
  const handleCancel = () => {
    setShowForm(false)
    setEditingTransaction(null)
  }

  /**
   * Handle add new transaction
   * @description Opens form for creating new transaction
   */
  const handleAddNew = () => {
    setEditingTransaction(null)
    setShowForm(true)
  }

  /**
   * Refresh transactions data
   * @description Reloads transactions from the server
   */
  const handleRefresh = async () => {
    if (!userId) return

    try {
      const transactionsData = await getTransactions(userId)
      setTransactions(transactionsData)
      toast.success('Transactions refreshed')
    } catch (error) {
      console.error('Error refreshing transactions:', error)
      toast.error('Failed to refresh transactions')
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex-1 space-y-4">
        {/* Page Header */}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
          <Button onClick={handleAddNew} disabled={isLoading}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>

        {/* Transactions List */}
        <TransactionsList
          transactions={transactions}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRefresh={handleRefresh}
        />

        {/* Transaction Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
              </DialogTitle>
            </DialogHeader>
            <TransactionForm
              initialData={editingTransaction ? (() => {
                const baseData = {
                  date: editingTransaction.date,
                  status: editingTransaction.status,
                  type: editingTransaction.type,
                  amount: editingTransaction.amount,
                  notes: editingTransaction.notes || '',
                }
                
                if (editingTransaction.type === 'transfer') {
                  return {
                    ...baseData,
                    fromAccountId: editingTransaction.fromAccountId || '',
                    toAccountId: editingTransaction.toAccountId || '',
                  } as TransactionFormData
                } else {
                  const depositWithdrawalData = {
                    ...baseData,
                    accountId: editingTransaction.accountId || '',
                    payeeId: editingTransaction.payeeId || undefined,
                    categoryId: editingTransaction.categoryId || undefined,
                    payeeName: undefined,
                    categoryName: undefined,
                  } as TransactionFormData
                  
                  // For withdrawal transactions, ensure we have either categoryId or categoryName
                  if (editingTransaction.type === 'withdrawal' && !editingTransaction.categoryId) {
                    // If no category is set, we'll let the user select one in the form
                    // The form validation will handle this requirement
                  }
                  
                  return depositWithdrawalData
                }
              })() : undefined}
              accounts={accounts}
              categories={categories}
              payees={payees}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
} 