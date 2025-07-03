/**
 * @file page.tsx
 * @description This file defines the payees page of the expense management application.
 * It provides complete payee management functionality including CRUD operations and CSV import.
 */
"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { PayeeForm } from "@/components/payees/payee-form"
import { PayeesList } from "@/components/payees/payees-list"
import { PayeeImport } from "@/components/payees/payee-import"
// Payees API functions
const getPayees = async (): Promise<Payee[]> => {
  const res = await fetch('/api/payees')
  if (!res.ok) throw new Error('Failed to fetch payees')
  const data = await res.json()
  return data.payees
}

const createPayee = async (formData: PayeeFormData): Promise<Payee> => {
  const res = await fetch('/api/payees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  })
  if (!res.ok) throw new Error('Failed to create payee')
  const data = await res.json()
  return data.payee
}

const updatePayee = async (id: string, formData: PayeeFormData): Promise<Payee> => {
  const res = await fetch(`/api/payees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  })
  if (!res.ok) throw new Error('Failed to update payee')
  const data = await res.json()
  return data.payee
}

const deletePayee = async (id: string): Promise<void> => {
  const res = await fetch(`/api/payees/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete payee')
}

const togglePayeeStatus = async (id: string): Promise<Payee> => {
  const res = await fetch(`/api/payees/${id}`, {
    method: 'PATCH'
  })
  if (!res.ok) throw new Error('Failed to toggle payee status')
  const data = await res.json()
  return data.payee
}

// Categories API functions
const getActiveCategories = async (): Promise<Category[]> => {
  const res = await fetch('/api/categories?active=true')
  if (!res.ok) throw new Error('Failed to fetch categories')
  const data = await res.json()
  return data.categories
}

import { useAuth } from "@/components/auth/auth-provider"
import { Payee, PayeeFormData } from "@/types/payee"
import { Category } from "@/types/category"

/**
 * PayeesPage component
 * @description Renders the payees management page with full CRUD functionality
 * @returns JSX element containing the payees page content
 */
export default function PayeesPage() {
  // Authentication
  const { user } = useAuth()
  
  const [payees, setPayees] = useState<Payee[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingPayee, setEditingPayee] = useState<Payee | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Load payees from database
   * @description Fetches all payees for the current user
   */
  const loadPayees = useCallback(async () => {
    try {
      if (!user?.id) return
      const data = await getPayees()
      setPayees(data)
    } catch (error) {
      console.error('Error loading payees:', error)
      toast.error('Failed to load payees')
    }
  }, [user?.id])

  /**
   * Load categories from database
   * @description Fetches all active categories for the current user
   */
  const loadCategories = useCallback(async () => {
    try {
      if (!user?.id) return
      const data = await getActiveCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Failed to load categories')
    }
  }, [user?.id])

  // Load payees and categories when user is available
  useEffect(() => {
    if (user?.id) {
      loadPayees()
      loadCategories()
    }
  }, [user?.id, loadPayees, loadCategories])

  /**
   * Handle adding new payee
   * @description Opens the form dialog for creating a new payee
   */
  const handleAddPayee = () => {
    setEditingPayee(null)
    setIsFormOpen(true)
  }

  /**
   * Handle editing existing payee
   * @description Opens the form dialog for editing an existing payee
   * @param payee - Payee to edit
   */
  const handleEditPayee = (payee: Payee) => {
    setEditingPayee(payee)
    setIsFormOpen(true)
  }

  /**
   * Handle form submission
   * @description Processes form data for creating or updating payees
   * @param formData - Payee form data
   */
  const handleFormSubmit = async (formData: PayeeFormData) => {
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingPayee) {
        // Update existing payee
        await updatePayee(editingPayee.id, formData)
        toast.success('Payee updated successfully')
      } else {
        // Create new payee
        await createPayee(formData)
        toast.success('Payee created successfully')
      }
      
      setIsFormOpen(false)
      setEditingPayee(null)
      await loadPayees()
    } catch (error) {
      console.error('Error saving payee:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save payee')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle payee deletion
   * @description Deletes a payee from the database
   * @param payeeId - ID of payee to delete
   */
  const handleDeletePayee = async (payeeId: string) => {
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    try {
      await deletePayee(payeeId)
      toast.success('Payee deleted successfully')
      await loadPayees()
    } catch (error) {
      console.error('Error deleting payee:', error)
      toast.error('Failed to delete payee')
    }
  }

  /**
   * Handle payee status toggle
   * @description Toggles the active status of a payee
   * @param payeeId - ID of payee to toggle
   */
  const handleToggleStatus = async (payeeId: string) => {
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    try {
      await togglePayeeStatus(payeeId)
      toast.success('Payee status updated')
      await loadPayees()
    } catch (error) {
      console.error('Error toggling payee status:', error)
      toast.error('Failed to update payee status')
    }
  }

  /**
   * Handle form cancellation
   * @description Closes the form dialog and resets state
   */
  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingPayee(null)
  }

  /**
   * Handle import dialog opening
   * @description Opens the import dialog
   */
  const handleImportPayees = () => {
    setIsImportOpen(true)
  }

  /**
   * Handle import completion
   * @description Processes import results and refreshes payee list
   * @param result - Import result summary
   */
  const handleImportComplete = async (result: { successful: number; failed: number; duplicates: number }) => {
    if (result.successful > 0) {
      await loadPayees()
    }
    // Import dialog will be closed automatically by the component
    setIsImportOpen(false)
  }

  return (
    <ProtectedRoute>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Payees</h2>
          <div className="flex items-center gap-2">
            <Button onClick={handleImportPayees} variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button onClick={handleAddPayee}>
              <Plus className="mr-2 h-4 w-4" />
              Add Payee
            </Button>
          </div>
        </div>
        
        <PayeesList
          payees={payees}
          categories={categories}
          onEdit={handleEditPayee}
          onDelete={handleDeletePayee}
          onToggleStatus={handleToggleStatus}
        />

        {/* Payee Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPayee ? 'Edit Payee' : 'Add New Payee'}
              </DialogTitle>
            </DialogHeader>
            <PayeeForm
              payee={editingPayee || undefined}
              categories={categories}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isLoading={isSubmitting}
            />
          </DialogContent>
        </Dialog>

        {/* Payee Import Dialog */}
        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Import Payees from CSV</DialogTitle>
            </DialogHeader>
            {user?.id && (
              <PayeeImport
                userId={user.id}
                onImportComplete={handleImportComplete}
                isLoading={isSubmitting}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
} 