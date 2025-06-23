/**
 * @file payee-form.tsx
 * @description This file contains the payee form component for creating and editing payees.
 * It provides a form interface with validation for payee management.
 */

"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { payeeFormSchema } from "@/lib/validations/payee"
import { PayeeFormData } from "@/types/payee"
import { Payee } from "@/types/payee"
import { Category } from "@/types/category"

/**
 * Props interface for PayeeForm component
 * @description Defines the properties passed to the PayeeForm component
 */
interface PayeeFormProps {
  payee?: Payee
  categories: Category[]
  onSubmit: (data: PayeeFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

/**
 * PayeeForm component
 * @description Renders a form for creating or editing payees with validation
 * @param payee - Optional existing payee data for editing
 * @param onSubmit - Function called when form is submitted with valid data
 * @param onCancel - Optional function called when form is cancelled
 * @param isLoading - Whether the form is in a loading state
 * @returns JSX element containing the payee form
 */
export function PayeeForm({ payee, categories, onSubmit, onCancel, isLoading = false }: PayeeFormProps) {
  const form = useForm<PayeeFormData>({
    resolver: zodResolver(payeeFormSchema),
    defaultValues: {
      displayName: payee?.displayName || "",
      description: payee?.description || "",
      category: payee?.category || "",
      isActive: payee?.isActive !== undefined ? payee.isActive : true,
    },
  })

  /**
   * Handle form submission
   * @description Processes form data and calls onSubmit function
   * @param data - Validated form data
   */
  const handleSubmit = async (data: PayeeFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Error submitting payee form:', error)
      // Form error handling is managed by the parent component
    }
  }

  const isEditing = !!payee

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Payee' : 'Create New Payee'}</CardTitle>
        <CardDescription>
          {isEditing 
            ? 'Update the details of your payee.'
            : 'Add a new payee to track who you make payments to.'
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
                      placeholder="e.g., Amazon, Netflix, Apollo Pharmacy"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    The name of the merchant, service provider, or person you pay.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            

            {/* Category Field */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value || undefined}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Categorize your payee for better organization and reporting.
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
                      placeholder="Optional description about this payee..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Add details about this payee, what you typically pay them for, etc.
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
                      Active payees are available for new transactions.
                      Inactive payees are hidden but preserve historical data.
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
                  isEditing ? 'Update Payee' : 'Create Payee'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
} 