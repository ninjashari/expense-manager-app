/**
 * @file transaction-form.tsx
 * @description This file contains the transaction form component for creating and editing transactions.
 * It handles different transaction types (deposit, withdrawal, transfer) with conditional fields.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { transactionFormSchema, TransactionFormData } from "@/lib/validations/transaction"
import { TRANSACTION_TYPE_OPTIONS, TRANSACTION_STATUS_OPTIONS, TransferFormData, DepositWithdrawalFormData } from "@/types/transaction"
import { Account, ACCOUNT_TYPE_OPTIONS } from "@/types/account"
import { Category } from "@/types/category"
import { Payee } from "@/types/payee"
import { cn } from "@/lib/utils"

/**
 * Props interface for TransactionForm component
 * @description Defines the props required for the transaction form
 */
interface TransactionFormProps {
  /**
   * Initial transaction data for editing (optional)
   */
  initialData?: Partial<TransactionFormData>
  /**
   * Available accounts for selection
   */
  accounts: Account[]
  /**
   * Available categories for selection
   */
  categories: Category[]
  /**
   * Available payees for selection
   */
  payees: Payee[]
  /**
   * Callback function called when form is submitted successfully
   * @param data - Form data submitted
   */
  onSubmit: (data: TransactionFormData) => Promise<void>
  /**
   * Callback function called when form submission is cancelled
   */
  onCancel?: () => void
  /**
   * Loading state for form submission
   */
  isLoading?: boolean
}

/**
 * TransactionForm component
 * @description Renders a form for creating or editing transactions with conditional fields
 * @param props - Component props
 * @returns JSX element containing the transaction form
 */
export function TransactionForm({
  initialData,
  accounts,
  categories,
  payees,
  onSubmit,
  onCancel,
  isLoading = false
}: TransactionFormProps) {
  const [selectedType, setSelectedType] = useState<'deposit' | 'withdrawal' | 'transfer'>(
    initialData?.type || 'deposit'
  )

  /**
   * Get default form values based on initial data or defaults
   * @description Creates appropriate default values for the form
   * @returns Default form values
   */
  const getDefaultValues = useCallback((): TransactionFormData => {
    if (initialData) {
      // If we have initial data, use it to populate the form
      if (initialData.type === 'transfer') {
        return {
          date: initialData.date || new Date(),
          status: initialData.status || 'completed',
          type: 'transfer',
          amount: initialData.amount || 0,
          notes: initialData.notes || '',
          fromAccountId: (initialData as TransferFormData).fromAccountId || '',
          toAccountId: (initialData as TransferFormData).toAccountId || '',
        } as TransferFormData
      } else {
        return {
          date: initialData.date || new Date(),
          status: initialData.status || 'completed',
          type: initialData.type || 'deposit',
          amount: initialData.amount || 0,
          notes: initialData.notes || '',
          accountId: (initialData as DepositWithdrawalFormData).accountId || '',
          payeeId: (initialData as DepositWithdrawalFormData).payeeId || '',
          categoryId: (initialData as DepositWithdrawalFormData).categoryId || '',
          payeeName: '',
          categoryName: '',
        } as DepositWithdrawalFormData
      }
    } else {
      // Default values for new transaction
      return {
        date: new Date(),
        status: 'completed',
        type: 'deposit',
        amount: 0,
        notes: '',
        accountId: '',
        payeeId: '',
        categoryId: '',
        payeeName: '',
        categoryName: '',
      } as DepositWithdrawalFormData
    }
  }, [initialData])

  /**
   * Form configuration using react-hook-form with Zod validation
   */
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: getDefaultValues()
  })

  // Watch form values for dynamic updates
  const watchedType = form.watch('type')

  // Update selectedType when form type changes
  useEffect(() => {
    setSelectedType(watchedType as 'deposit' | 'withdrawal' | 'transfer')
  }, [watchedType])

  // Reset form when initialData changes (for editing vs new transaction)
  useEffect(() => {
    const defaultValues = getDefaultValues()
    form.reset(defaultValues)
    setSelectedType(defaultValues.type as 'deposit' | 'withdrawal' | 'transfer')
  }, [getDefaultValues, form])

  /**
   * Form submission handler
   * @description Processes form data and calls onSubmit callback
   * @param data - Form data from react-hook-form
   */
  const handleSubmit = async (data: TransactionFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Transaction form submission error:', error)
      // Re-throw the error so the parent component can handle it
      throw error
    }
  }

  /**
   * Get active accounts for selection
   * @description Filters accounts to only show active ones
   * @returns Array of active accounts
   */
  const activeAccounts = accounts.filter(account => account.status === 'active')

  /**
   * Get active categories for selection
   * @description Filters categories to only show active ones
   * @returns Array of active categories
   */
  const activeCategories = categories.filter(category => category.isActive)

  /**
   * Get active payees for selection
   * @description Filters payees to only show active ones
   * @returns Array of active payees
   */
  const activePayees = payees.filter(payee => payee.isActive)

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {initialData ? 'Edit Transaction' : 'Add New Transaction'}
        </CardTitle>
        <CardDescription>
          {selectedType === 'transfer' 
            ? 'Transfer money between your accounts'
            : `Record a ${selectedType} transaction`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Transaction Type Selection */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TRANSACTION_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Field */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status Field */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TRANSACTION_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Amount Field */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditional Fields Based on Transaction Type */}
            {selectedType === 'transfer' ? (
              // Transfer-specific fields
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fromAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Account</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select source account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {activeAccounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name} ({account.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="toAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To Account</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select destination account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {activeAccounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name} ({ACCOUNT_TYPE_OPTIONS.find(option => option.value === account.type)?.label})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ) : (
              // Deposit/Withdrawal-specific fields
              <div className="space-y-6">
                {/* Account Selection */}
                <FormField
                  control={form.control}
                  name="accountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name} ({ACCOUNT_TYPE_OPTIONS.find(option => option.value === account.type)?.label})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Payee Selection */}
                <div className="space-y-4">
                  <Label>Payee</Label>
                  <Tabs defaultValue="existing" className="w-full">
                    <TabsList>
                      <TabsTrigger value="existing">
                        Select Existing
                      </TabsTrigger>
                      <TabsTrigger value="new">
                        Add New
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="existing">
                      <FormField
                        control={form.control}
                        name="payeeId"
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select payee" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {activePayees.map((payee) => (
                                  <SelectItem key={payee.id} value={payee.id}>
                                    {payee.displayName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    <TabsContent value="new">
                      <FormField
                        control={form.control}
                        name="payeeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Enter new payee name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Category Selection (required for withdrawals) */}
                <div className="space-y-4">
                  <Label>
                    Category {selectedType === 'withdrawal' && <span className="text-red-500">*</span>}
                  </Label>
                  <Tabs defaultValue="existing" className="w-full">
                    <TabsList>
                      <TabsTrigger value="existing">
                        Select Existing
                      </TabsTrigger>
                      <TabsTrigger value="new">
                        Add New
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="existing">
                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {activeCategories.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.displayName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    <TabsContent value="new">
                      <FormField
                        control={form.control}
                        name="categoryName"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Enter new category name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}

            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about this transaction..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="mt-2 sm:mt-0"
                >
                  Cancel
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? 'Update Transaction' : 'Create Transaction'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
} 