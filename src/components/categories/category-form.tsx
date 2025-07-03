/**
 * @file category-form.tsx
 * @description This file contains the category form component for creating and editing categories.
 * It provides a form interface with validation for category management.
 */

"use client"

import { useForm } from "react-hook-form"
import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { categoryFormSchema } from "@/lib/validations/category"
import { CategoryFormData } from "@/types/category"
import { Category } from "@/types/category"

/**
 * Props interface for CategoryForm component
 * @description Defines the properties passed to the CategoryForm component
 */
interface CategoryFormProps {
  category?: Category
  onSubmit: (data: CategoryFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

/**
 * CategoryForm component
 * @description Renders a form for creating or editing categories with validation
 * @param category - Optional existing category data for editing
 * @param onSubmit - Function called when form is submitted with valid data
 * @param onCancel - Optional function called when form is cancelled
 * @param isLoading - Whether the form is in a loading state
 * @returns JSX element containing the category form
 */
export function CategoryForm({ category, onSubmit, onCancel, isLoading = false }: CategoryFormProps) {
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      displayName: category?.displayName || "",
      description: category?.description || "",
      isActive: category?.isActive !== undefined ? category.isActive : true,
    },
  })

  // Reset form when category prop changes (for editing vs new category)
  useEffect(() => {
    if (category) {
      form.reset({
        displayName: category.displayName,
        description: category.description,
        isActive: category.isActive,
      })
    }
  }, [category, form])

  /**
   * Handle form submission
   * @description Processes form data and calls onSubmit function
   * @param data - Validated form data
   */
  const handleSubmit = async (data: CategoryFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Error submitting category form:', error)
      // Form error handling is managed by the parent component
    }
  }

  const isEditing = !!category

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Category' : 'Create New Category'}</CardTitle>
        <CardDescription>
          {isEditing 
            ? 'Update the details of your expense category.'
            : 'Add a new category to organize your expenses.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Display Name Field */}
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Groceries, Transportation, Entertainment"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    This is the name that will be displayed throughout the app.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description for this category..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Add details about what expenses belong to this category.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active Status Field */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Active categories are available for new transactions.
                      Inactive categories are hidden but preserve historical data.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-4">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditing ? 'Update Category' : 'Create Category'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
} 