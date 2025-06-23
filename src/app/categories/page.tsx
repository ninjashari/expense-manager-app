/**
 * @file page.tsx
 * @description This file defines the categories page of the expense management application.
 * It provides complete category management functionality including CRUD operations.
 */
"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { CategoryForm } from "@/components/categories/category-form"
import { CategoriesList } from "@/components/categories/categories-list"
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  toggleCategoryStatus,
  getCurrentUserId 
} from "@/lib/services/supabase-category-service"
import { Category, CategoryFormData } from "@/types/category"

/**
 * CategoriesPage component
 * @description Renders the categories management page with full CRUD functionality
 * @returns JSX element containing the categories page content
 */
export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  /**
   * Load categories from database
   * @description Fetches all categories for the current user
   */
  const loadCategories = useCallback(async () => {
    try {
      if (!userId) return
      const data = await getCategories(userId)
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Failed to load categories')
    }
  }, [userId])

  /**
   * Initialize user and load categories
   * @description Gets current user ID and loads their categories
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

  // Load categories when userId is available
  useEffect(() => {
    if (userId) {
      loadCategories()
    }
  }, [userId, loadCategories])

  /**
   * Handle adding new category
   * @description Opens the form dialog for creating a new category
   */
  const handleAddCategory = () => {
    setEditingCategory(null)
    setIsFormOpen(true)
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
    if (!userId) {
      toast.error('User not authenticated')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingCategory) {
        // Update existing category
        await updateCategory(editingCategory.id, formData, userId)
        toast.success('Category updated successfully')
      } else {
        // Create new category
        await createCategory(formData, userId)
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
    if (!userId) {
      toast.error('User not authenticated')
      return
    }

    try {
      await deleteCategory(categoryId, userId)
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
    if (!userId) {
      toast.error('User not authenticated')
      return
    }

    try {
      await toggleCategoryStatus(categoryId, userId)
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

  return (
    <ProtectedRoute>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <Button onClick={handleAddCategory}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
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
      </div>
    </ProtectedRoute>
  )
} 