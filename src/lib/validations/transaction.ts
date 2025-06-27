/**
 * @file transaction.ts
 * @description This file contains validation schemas for transaction management forms.
 * It uses Zod for type-safe form validation and error handling.
 */
import { z } from 'zod'

/**
 * Get the end of the current day for date validation
 * @description Returns a date object set to 23:59:59.999 of the current day
 * @returns Date object representing the end of today
 */
function getEndOfToday(): Date {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return today
}

/**
 * Base transaction validation schema
 * @description Common validation rules for all transaction types
 */
const baseTransactionSchema = z.object({
  date: z
    .date({
      required_error: 'Transaction date is required',
      invalid_type_error: 'Please select a valid date',
    })
    .max(getEndOfToday(), 'Transaction date cannot be in the future'),
  
  status: z.enum(['pending', 'completed', 'cancelled'], {
    required_error: 'Transaction status is required',
  }),
  
  amount: z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    })
    .min(0.01, 'Amount must be greater than 0')
    .max(10000000, 'Amount cannot be more than 1,00,00,000'),
  
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
})

/**
 * Deposit/Withdrawal transaction validation schema
 * @description Validation rules for deposit and withdrawal transactions
 */
export const depositWithdrawalTransactionSchema = baseTransactionSchema.extend({
  type: z.enum(['deposit', 'withdrawal'], {
    required_error: 'Transaction type is required',
  }),
  
  accountId: z
    .string()
    .min(1, 'Account is required')
    .uuid('Invalid account ID'),
  
  payeeId: z
    .string()
    .uuid('Invalid payee ID')
    .optional()
    .or(z.literal('')),
  
  payeeName: z
    .string()
    .min(2, 'Payee name must be at least 2 characters')
    .max(100, 'Payee name must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  
  categoryId: z
    .string()
    .uuid('Invalid category ID')
    .optional()
    .or(z.literal('')),
  
  categoryName: z
    .string()
    .min(2, 'Category name must be at least 2 characters')
    .max(50, 'Category name must be less than 50 characters')
    .optional()
    .or(z.literal('')),
}).refine(
  (data) => {
    // Either payeeId or payeeName should be provided, but not both
    const hasPayeeId = !!data.payeeId && data.payeeId.trim() !== ''
    const hasPayeeName = !!data.payeeName && data.payeeName.trim() !== ''
    return hasPayeeId || hasPayeeName
  },
  {
    message: 'Either select an existing payee or enter a new payee name',
    path: ['payeeId'],
  }
).refine(
  (data) => {
    // Either categoryId or categoryName should be provided for withdrawal transactions
    if (data.type === 'withdrawal') {
      const hasCategoryId = !!data.categoryId && data.categoryId.trim() !== ''
      const hasCategoryName = !!data.categoryName && data.categoryName.trim() !== ''
      return hasCategoryId || hasCategoryName
    }
    return true
  },
  {
    message: 'Category is required for withdrawal transactions',
    path: ['categoryId'],
  }
)

/**
 * Transfer transaction validation schema
 * @description Validation rules for transfer transactions
 */
export const transferTransactionSchema = baseTransactionSchema.extend({
  type: z.literal('transfer', {
    required_error: 'Transaction type must be transfer',
  }),
  
  fromAccountId: z
    .string()
    .min(1, 'From account is required')
    .uuid('Invalid from account ID'),
  
  toAccountId: z
    .string()
    .min(1, 'To account is required')
    .uuid('Invalid to account ID'),
}).refine(
  (data) => {
    // From and to accounts should be different
    return data.fromAccountId !== data.toAccountId
  },
  {
    message: 'From and to accounts must be different',
    path: ['toAccountId'],
  }
)

/**
 * Union transaction validation schema
 * @description Combined validation for all transaction types
 */
export const transactionFormSchema = z.union([
  depositWithdrawalTransactionSchema,
  transferTransactionSchema,
])

/**
 * Transaction form data types
 * @description Inferred types from the validation schemas
 */
export type DepositWithdrawalTransactionFormData = z.infer<typeof depositWithdrawalTransactionSchema>
export type TransferTransactionFormData = z.infer<typeof transferTransactionSchema>
export type TransactionFormData = z.infer<typeof transactionFormSchema>

/**
 * Transaction search/filter schema
 * @description Validation for transaction filtering and search
 */
export const transactionFilterSchema = z.object({
  search: z.string().optional(),
  type: z.enum(['all', 'deposit', 'withdrawal', 'transfer']).optional(),
  status: z.enum(['all', 'pending', 'completed', 'cancelled']).optional(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  payeeId: z.string().uuid().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  amountMin: z.number().min(0).optional(),
  amountMax: z.number().min(0).optional(),
}).refine(
  (data) => {
    // If both date filters are provided, dateFrom should be before dateTo
    if (data.dateFrom && data.dateTo) {
      return data.dateFrom <= data.dateTo
    }
    return true
  },
  {
    message: 'From date must be before or equal to to date',
    path: ['dateTo'],
  }
).refine(
  (data) => {
    // If both amount filters are provided, amountMin should be less than amountMax
    if (data.amountMin !== undefined && data.amountMax !== undefined) {
      return data.amountMin <= data.amountMax
    }
    return true
  },
  {
    message: 'Minimum amount must be less than or equal to maximum amount',
    path: ['amountMax'],
  }
)

/**
 * Transaction filter data type
 * @description Inferred type from the filter schema
 */
export type TransactionFilterData = z.infer<typeof transactionFilterSchema> 