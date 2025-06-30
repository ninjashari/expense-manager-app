/**
 * @file page.tsx
 * @description This file defines the accounts page of the expense management application.
 * It provides comprehensive account management with CRUD operations, filtering, and detailed views.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { AccountsList } from '@/components/accounts/accounts-list'
import { AccountForm } from '@/components/accounts/account-form'
import { AccountDetails } from '@/components/accounts/account-details'
import { AccountImport } from '@/components/accounts/account-import'

import { Account } from '@/types/account'
import { AccountFormData } from '@/lib/validations/account'
import { formatDateForDatabase, parseDateFromDatabase } from '@/lib/utils'
// Accounts API functions
const getAccounts = async (): Promise<Account[]> => {
  const res = await fetch('/api/accounts')
  if (!res.ok) throw new Error('Failed to fetch accounts')
  const data = await res.json()
  
  // Parse date strings back to Date objects
  return data.accounts.map((account: Account & { 
    accountOpeningDate: string; 
    createdAt: string; 
    updatedAt: string; 
  }) => ({
    ...account,
    accountOpeningDate: parseDateFromDatabase(account.accountOpeningDate),
    createdAt: new Date(account.createdAt),
    updatedAt: new Date(account.updatedAt)
  }))
}

const createAccount = async (formData: AccountFormData): Promise<Account> => {
  // Format the date properly before sending to API
  const requestData = {
    ...formData,
    accountOpeningDate: formatDateForDatabase(formData.accountOpeningDate)
  }
  
  const res = await fetch('/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  })
  if (!res.ok) throw new Error('Failed to create account')
  const data = await res.json()
  
  // Parse date strings back to Date objects
  return {
    ...data.account,
    accountOpeningDate: parseDateFromDatabase(data.account.accountOpeningDate),
    createdAt: new Date(data.account.createdAt),
    updatedAt: new Date(data.account.updatedAt)
  }
}

const updateAccount = async (id: string, formData: AccountFormData): Promise<Account> => {
  // Format the date properly before sending to API
  const requestData = {
    ...formData,
    accountOpeningDate: formatDateForDatabase(formData.accountOpeningDate)
  }
  
  const res = await fetch(`/api/accounts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  })
  if (!res.ok) throw new Error('Failed to update account')
  const data = await res.json()
  
  // Parse date strings back to Date objects
  return {
    ...data.account,
    accountOpeningDate: parseDateFromDatabase(data.account.accountOpeningDate),
    createdAt: new Date(data.account.createdAt),
    updatedAt: new Date(data.account.updatedAt)
  }
}

const deleteAccount = async (id: string): Promise<boolean> => {
  const res = await fetch(`/api/accounts/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete account')
  return true
}
import { useAuth } from '@/components/auth/auth-provider'

/**
 * View modes for the accounts page
 * @description Defines different views available in the accounts page
 */
type ViewMode = 'list' | 'add' | 'edit' | 'details' | 'import'

/**
 * AccountsPage component
 * @description Main accounts management page with CRUD operations
 * @returns JSX element containing the accounts page content
 */
export default function AccountsPage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  /**
   * Load accounts from service
   * @description Fetches all accounts for the current user with fresh balance calculations
   */
  const loadAccounts = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const userAccounts = await getAccounts()
      setAccounts(userAccounts)
    } catch (error) {
      console.error('Failed to load accounts:', error)
      toast.error('Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }, [user])

  /**
   * Load accounts on component mount and user change
   */
  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  /**
   * Handle add new account
   * @description Opens the add account form
   */
  const handleAdd = () => {
    setSelectedAccount(null)
    setViewMode('add')
  }

  /**
   * Handle import accounts
   * @description Opens the import accounts dialog
   */
  const handleImport = () => {
    setViewMode('import')
  }

  /**
   * Handle edit account
   * @description Opens the edit form for the selected account
   * @param account - Account to edit
   */
  const handleEdit = (account: Account) => {
    setSelectedAccount(account)
    setViewMode('edit')
  }

  /**
   * Handle view account details
   * @description Opens the detailed view for the selected account
   * @param account - Account to view
   */
  const handleView = (account: Account) => {
    setSelectedAccount(account)
    setViewMode('details')
  }

  /**
   * Handle delete account
   * @description Deletes the specified account
   * @param accountId - ID of account to delete
   */
  const handleDelete = async (accountId: string) => {
    if (!user) return

    try {
      const success = await deleteAccount(accountId)
      if (success) {
        toast.success('Account deleted successfully')
        await loadAccounts() // Reload accounts list
      } else {
        toast.error('Failed to delete account')
      }
    } catch (error) {
      console.error('Failed to delete account:', error)
      toast.error('Failed to delete account')
    }
  }

  /**
   * Handle form submission for create/update
   * @description Processes account form submission
   * @param formData - Account form data
   */
  const handleFormSubmit = async (formData: AccountFormData) => {
    if (!user) return

    try {
      setFormLoading(true)
      
      if (viewMode === 'add') {
        // Create new account
        const newAccount = await createAccount(formData)
        toast.success('Account created successfully')
        setAccounts(prev => [...prev, newAccount])
      } else if (viewMode === 'edit' && selectedAccount) {
        // Update existing account
        const updatedAccount = await updateAccount(selectedAccount.id, formData)
        if (updatedAccount) {
          toast.success('Account updated successfully')
          setAccounts(prev => 
            prev.map(acc => acc.id === selectedAccount.id ? updatedAccount : acc)
          )
        } else {
          toast.error('Failed to update account')
          return
        }
      }
      
      // Return to list view
      setViewMode('list')
      setSelectedAccount(null)
    } catch (error) {
      console.error('Failed to save account:', error)
      toast.error('Failed to save account')
    } finally {
      setFormLoading(false)
    }
  }

  /**
   * Handle form cancellation
   * @description Cancels form and returns to list view
   */
  const handleFormCancel = () => {
    setViewMode('list')
    setSelectedAccount(null)
  }

  /**
   * Handle import completion
   * @description Called when import process is completed
   * @param result - Import result summary
   */
  const handleImportComplete = async (result: { successful: number; failed: number; duplicates: number }) => {
    if (result.successful > 0) {
      await loadAccounts() // Refresh the accounts list
    }
    setViewMode('list') // Return to list view
  }

  /**
   * Handle details edit button
   * @description Switches from details view to edit form
   */
  const handleDetailsEdit = () => {
    setViewMode('edit')
  }

  /**
   * Handle details close button
   * @description Closes details view and returns to list
   */
  const handleDetailsClose = () => {
    setViewMode('list')
    setSelectedAccount(null)
  }

  /**
   * Handle refresh balances
   * @description Manually recalculates account balances and reloads accounts
   */
  const handleRefresh = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      toast.info('Refreshing accounts...')
      
      // Reload accounts
      const userAccounts = await getAccounts()
      setAccounts(userAccounts)
      toast.success('Accounts refreshed successfully')
    } catch (error) {
      console.error('Failed to refresh accounts:', error)
      toast.error('Failed to refresh accounts')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Render content based on current view mode
   * @description Returns appropriate component based on view mode
   */
  const renderContent = () => {
    switch (viewMode) {
      case 'add':
      case 'edit':
        return (
          <div className="flex justify-center">
            <AccountForm
              account={selectedAccount || undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isLoading={formLoading}
            />
          </div>
        )
      
      case 'details':
        return selectedAccount ? (
          <AccountDetails
            account={selectedAccount}
            onEdit={handleDetailsEdit}
            onClose={handleDetailsClose}
          />
        ) : null
      
      case 'import':
        return (
          <AccountImport
            onImportComplete={handleImportComplete}
            existingAccounts={accounts}
          />
        )
      
      case 'list':
      default:
        return (
          <AccountsList
            accounts={accounts}
            onAdd={handleAdd}
            onImport={handleImport}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDelete}
            onRefresh={handleRefresh}
            isLoading={loading}
          />
        )
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex-1 space-y-4">
        {/* Page Header */}
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
            <p className="text-muted-foreground">
              Manage your bank accounts, credit cards, and wallets
            </p>
          </div>
        </div>
        
        {/* Main Content */}
        {renderContent()}
      </div>
    </ProtectedRoute>
  )
} 