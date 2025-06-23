/**
 * @file page.tsx
 * @description This file defines the payees page of the expense management application.
 * It provides complete payee management functionality including CRUD operations.
 */
"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { PayeeForm } from "@/components/payees/payee-form"
import { PayeesList } from "@/components/payees/payees-list"
import { 
  getPayees, 
  createPayee, 
  updatePayee, 
  deletePayee, 
  togglePayeeStatus,
  getCurrentUserId 
} from "@/lib/services/supabase-payee-service"
import { getActiveCategories } from "@/lib/services/supabase-category-service"
import { Payee, PayeeFormData } from "@/types/payee"
import { Category } from "@/types/category"

/**
 * PayeesPage component
 * @description Renders the payees management page with full CRUD functionality
 * @returns JSX element containing the payees page content
 */
export default function PayeesPage() {
  const [payees, setPayees] = useState<Payee[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPayee, setEditingPayee] = useState<Payee | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  /**
   * Load payees from database
   * @description Fetches all payees for the current user
   */
  const loadPayees = useCallback(async () => {
    try {
      if (!userId) return
      const data = await getPayees(userId)
      setPayees(data)
    } catch (error) {
      console.error('Error loading payees:', error)
      toast.error('Failed to load payees')
    }
  }, [userId])

  /**
   * Load categories from database
   * @description Fetches all active categories for the current user
   */
  const loadCategories = useCallback(async () => {
    try {
      if (!userId) return
      const data = await getActiveCategories(userId)
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Failed to load categories')
    }
  }, [userId])

  /**
   * Initialize user and load payees
   * @description Gets current user ID and loads their payees
   */
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const currentUserId = await getCurrentUserId()
        if (currentUserId) {
          setUserId(currentUserId)
        } else {
          toast.error('User not authenticated')
        }
      } catch (error) {
        console.error('Error getting user ID:', error)
        toast.error('Authentication error')
      }
    }

    initializeUser()
  }, [])

  // Load payees and categories when userId is available
  useEffect(() => {
    if (userId) {
      loadPayees()
      loadCategories()
    }
  }, [userId, loadPayees, loadCategories])

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
    if (!userId) {
      toast.error('User not authenticated')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingPayee) {
        // Update existing payee
        await updatePayee(editingPayee.id, formData, userId)
        toast.success('Payee updated successfully')
      } else {
        // Create new payee
        await createPayee(formData, userId)
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
    if (!userId) {
      toast.error('User not authenticated')
      return
    }

    try {
      await deletePayee(payeeId, userId)
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
    if (!userId) {
      toast.error('User not authenticated')
      return
    }

    try {
      await togglePayeeStatus(payeeId, userId)
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

  return (
    <ProtectedRoute>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Payees</h2>
          <Button onClick={handleAddPayee}>
            <Plus className="mr-2 h-4 w-4" />
            Add Payee
          </Button>
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
      </div>
    </ProtectedRoute>
  )
} 