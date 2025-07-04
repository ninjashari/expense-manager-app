/**
 * @file page.tsx
 * @description This file defines the transactions page of the expense management application.
 * It provides full CRUD functionality for managing transactions with support for deposits, withdrawals, and transfers.
 */

"use client"

import { useEffect, useState } from "react"
import { Plus, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { TransactionForm } from "@/components/transactions/transaction-form"
import { TransactionsList } from "@/components/transactions/transactions-list"
import { TransactionImport } from "@/components/transactions/transaction-import"

import { Transaction, TransactionFormData } from "@/types/transaction"
import { Account } from "@/types/account"
import { Category } from "@/types/category"
import { Payee } from "@/types/payee"

// Transactions API functions
const getTransactions = async (): Promise<Transaction[]> => {
  const res = await fetch('/api/transactions')
  if (!res.ok) throw new Error('Failed to fetch transactions')
  const data = await res.json()
  return data.transactions
}

const createTransaction = async (formData: TransactionFormData): Promise<Transaction> => {
  const res = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  })
  if (!res.ok) throw new Error('Failed to create transaction')
  const data = await res.json()
  return data.transaction
}

const updateTransaction = async (id: string, formData: TransactionFormData): Promise<Transaction> => {
  const res = await fetch(`/api/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  })
  if (!res.ok) throw new Error('Failed to update transaction')
  const data = await res.json()
  return data.transaction
}

const deleteTransaction = async (id: string): Promise<void> => {
  const res = await fetch(`/api/transactions/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete transaction')
}

// Accounts API functions
const getAccounts = async (): Promise<Account[]> => {
  const res = await fetch('/api/accounts')
  if (!res.ok) throw new Error('Failed to fetch accounts')
  const data = await res.json()
  return data.accounts
}

// Categories API functions
const getActiveCategories = async (): Promise<Category[]> => {
  const res = await fetch('/api/categories?active=true')
  if (!res.ok) throw new Error('Failed to fetch categories')
  const data = await res.json()
  return data.categories
}

// Payees API functions
const getActivePayees = async (): Promise<Payee[]> => {
  const res = await fetch('/api/payees?active=true')
  if (!res.ok) throw new Error('Failed to fetch payees')
  const data = await res.json()
  return data.payees
}

import { useAuth } from "@/components/auth/auth-provider"

/**
 * TransactionsPage component
 * @description Renders the transactions management page with full CRUD functionality
 * @returns JSX element containing the transactions page content
 */
export default function TransactionsPage() {
  // Authentication
  const { user } = useAuth()
  
  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [payees, setPayees] = useState<Payee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  /**
   * Load all required data when user is available
   * @description Loads transactions, accounts, categories, and payees
   */
  useEffect(() => {
    if (!user?.id) return

    const loadData = async () => {
      setIsLoading(true)
      try {
        const [
          transactionsData,
          accountsData,
          categoriesData,
          payeesData
        ] = await Promise.all([
          getTransactions(),
          getAccounts(),
          getActiveCategories(),
          getActivePayees()
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
  }, [user?.id])

  /**
   * Handle form submission for creating or updating transactions
   * @description Processes form data and calls appropriate service function
   * @param formData - Transaction form data
   */
  const handleSubmit = async (formData: TransactionFormData) => {
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingTransaction) {
        // Update existing transaction
        const updatedTransaction = await updateTransaction(
          editingTransaction.id,
          formData
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
        const newTransaction = await createTransaction(formData)
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
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      return
    }

    try {
      await deleteTransaction(transaction.id)
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
   * Handle import transactions
   * @description Opens import dialog for bulk transaction import
   */
  const handleImport = () => {
    setShowImport(true)
  }

  /**
   * Handle import completion
   * @description Refreshes data after successful import
   */
  const handleImportComplete = () => {
    setShowImport(false)
    handleRefresh()
  }

  /**
   * Refresh transactions data
   * @description Reloads transactions from the server
   */
  const handleRefresh = async () => {
    if (!user?.id) return

    try {
      const transactionsData = await getTransactions()
      setTransactions(transactionsData)
      toast.success('Transactions refreshed')
    } catch (error) {
      console.error('Error refreshing transactions:', error)
      toast.error('Failed to refresh transactions')
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex-1 space-y-4 max-w-full overflow-hidden">
        {/* Page Header */}
        <div className="flex items-center justify-between space-y-2 flex-wrap gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
          <div className="flex space-x-2 flex-wrap gap-2">
            <Button variant="outline" onClick={handleImport} disabled={isLoading} size="sm">
              <Upload className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Import CSV</span>
              <span className="sm:hidden">Import</span>
            </Button>
            <Button onClick={handleAddNew} disabled={isLoading} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Add Transaction</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="w-full">
          <TransactionsList
            transactions={transactions}
            accounts={accounts}
            categories={categories}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRefresh={handleRefresh}
          />
        </div>

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
                  return {
                    ...baseData,
                    accountId: editingTransaction.accountId || '',
                    payeeId: editingTransaction.payeeId || '',
                    categoryId: editingTransaction.categoryId || '',
                    payeeName: '',
                    categoryName: '',
                  } as TransactionFormData
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

        {/* Import Dialog */}
        <Dialog open={showImport} onOpenChange={setShowImport}>
          <DialogContent className="w-[60vw] min-w-[800px] max-w-none max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Import Transactions</DialogTitle>
            </DialogHeader>
            {user?.id && (
              <TransactionImport
                accounts={accounts}
                categories={categories}
                payees={payees}
                onImportComplete={handleImportComplete}
                userId={user.id}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
} 