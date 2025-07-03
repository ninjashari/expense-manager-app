/**
 * @file page.tsx
 * @description This file defines the categories page of the expense management application.
 * It provides complete category management functionality including CRUD operations.
 */
"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { CategoryForm } from "@/components/categories/category-form"
import { CategoryImport } from "@/components/categories/category-import"
import { CategoriesList } from "@/components/categories/categories-list"
// Categories API functions
const getCategories = async (): Promise<Category[]> => {
  const res = await fetch('/api/categories')
  if (!res.ok) throw new Error('Failed to fetch categories')
  const data = await res.json()
  return data.categories
}

const createCategory = async (formData: CategoryFormData): Promise<Category> => {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  })
  if (!res.ok) throw new Error('Failed to create category')
  const data = await res.json()
  return data.category
}

const updateCategory = async (id: string, formData: CategoryFormData): Promise<Category> => {
  const res = await fetch(`/api/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  })
  if (!res.ok) throw new Error('Failed to update category')
  const data = await res.json()
  return data.category
}

const deleteCategory = async (id: string): Promise<void> => {
  const res = await fetch(`/api/categories/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete category')
}

const toggleCategoryStatus = async (id: string): Promise<Category> => {
  const res = await fetch(`/api/categories/${id}`, {
    method: 'PATCH'
  })
  if (!res.ok) throw new Error('Failed to toggle category status')
  const data = await res.json()
  return data.category
}
import { useAuth } from "@/components/auth/auth-provider"
import { Category, CategoryFormData } from "@/types/category"

/**
 * CategoriesPage component
 * @description Renders the categories management page with full CRUD functionality
 * @returns JSX element containing the categories page content
 */
export default function CategoriesPage() {
  // Authentication
  const { user } = useAuth()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Load categories from database
   * @description Fetches all categories for the current user
   */
  const loadCategories = useCallback(async () => {
    try {
      if (!user?.id) return
      const data = await getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Failed to load categories')
    }
  }, [user?.id])

  // Load categories when user is available
  useEffect(() => {
    if (user?.id) {
      loadCategories()
    }
  }, [user?.id, loadCategories])

  /**
   * Handle adding new category
   * @description Opens the form dialog for creating a new category
   */
  const handleAddCategory = () => {
    setEditingCategory(null)
    setIsFormOpen(true)
  }

  /**
   * Handle opening import dialog
   * @description Opens the import dialog for bulk category import
   */
  const handleImportCategories = () => {
    setIsImportOpen(true)
  }

  /**
   * Handle editing existing category
   * @description Opens the form dialog for editing an existing category
   * @param category - Category to edit
   */
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setIsFormOpen(true)
  }

  /**
   * Handle form submission
   * @description Processes form data for creating or updating categories
   * @param formData - Category form data
   */
  const handleFormSubmit = async (formData: CategoryFormData) => {
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingCategory) {
        // Update existing category
        await updateCategory(editingCategory.id, formData)
        toast.success('Category updated successfully')
      } else {
        // Create new category
        await createCategory(formData)
        toast.success('Category created successfully')
      }
      
      setIsFormOpen(false)
      setEditingCategory(null)
      await loadCategories()
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save category')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle category deletion
   * @description Deletes a category from the database
   * @param categoryId - ID of category to delete
   */
  const handleDeleteCategory = async (categoryId: string) => {
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    try {
      await deleteCategory(categoryId)
      toast.success('Category deleted successfully')
      await loadCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    }
  }

  /**
   * Handle category status toggle
   * @description Toggles the active status of a category
   * @param categoryId - ID of category to toggle
   */
  const handleToggleStatus = async (categoryId: string) => {
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    try {
      await toggleCategoryStatus(categoryId)
      toast.success('Category status updated')
      await loadCategories()
    } catch (error) {
      console.error('Error toggling category status:', error)
      toast.error('Failed to update category status')
    }
  }

  /**
   * Handle form cancellation
   * @description Closes the form dialog and resets state
   */
  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingCategory(null)
  }

  /**
   * Handle import completion
   * @description Called when import process is completed
   * @param result - Import result summary
   */
  const handleImportComplete = async (result: { successful: number }) => {
    if (result.successful > 0) {
      await loadCategories() // Refresh the categories list
    }
    // Keep the dialog open to show results
  }

  /**
   * Handle import dialog close
   * @description Closes the import dialog
   */
  const handleImportClose = () => {
    setIsImportOpen(false)
  }

  return (
    <ProtectedRoute>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleImportCategories}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button onClick={handleAddCategory}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
        </div>
        
        <CategoriesList
          categories={categories}
          onEdit={handleEditCategory}
          onDelete={handleDeleteCategory}
          onToggleStatus={handleToggleStatus}
        />

        {/* Category Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
            </DialogHeader>
            <CategoryForm
              category={editingCategory || undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isLoading={isSubmitting}
            />
          </DialogContent>
        </Dialog>

        {/* Category Import Dialog */}
        <Dialog open={isImportOpen} onOpenChange={handleImportClose}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Import Categories from CSV</DialogTitle>
            </DialogHeader>
            {user?.id && (
              <CategoryImport
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