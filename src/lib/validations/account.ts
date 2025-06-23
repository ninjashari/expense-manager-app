/**
 * @file account.ts
 * @description This file contains validation schemas for account management forms.
 * It uses Zod for type-safe form validation and error handling.
 */
import { z } from 'zod'

/**
 * Account form validation schema
 * @description Defines validation rules for account creation and editing
 */
export const accountFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Account name is required')
    .min(2, 'Account name must be at least 2 characters')
    .max(100, 'Account name must be less than 100 characters'),
  
  type: z.enum(['savings', 'checking', 'credit_card', 'investment', 'cash', 'loan', 'other'], {
    required_error: 'Account type is required',
  }),
  
  status: z.enum(['active', 'inactive', 'closed'], {
    required_error: 'Account status is required',
  }),
  
  initialBalance: z
    .number({
      required_error: 'Initial balance is required',
      invalid_type_error: 'Initial balance must be a number',
    })
    .min(-1000000, 'Initial balance cannot be less than -10,00,000')
    .max(10000000, 'Initial balance cannot be more than 1,00,00,000'),
  
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP'], {
    required_error: 'Currency is required',
  }),
  
  accountOpeningDate: z
    .date({
      required_error: 'Account opening date is required',
      invalid_type_error: 'Please select a valid date',
    })
    .max(new Date(), 'Account opening date cannot be in the future'),
  
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
  
  // Credit card specific fields
  creditLimit: z
    .number({
      invalid_type_error: 'Credit limit must be a number',
    })
    .min(0, 'Credit limit cannot be negative')
    .max(10000000, 'Credit limit cannot be more than 1,00,00,000')
    .optional(),
  
  paymentDueDate: z
    .number({
      invalid_type_error: 'Payment due date must be a number',
    })
    .min(1, 'Payment due date must be between 1 and 31')
    .max(31, 'Payment due date must be between 1 and 31')
    .optional(),
  
  billGenerationDate: z
    .number({
      invalid_type_error: 'Bill generation date must be a number',
    })
    .min(1, 'Bill generation date must be between 1 and 31')
    .max(31, 'Bill generation date must be between 1 and 31')
    .optional(),
  
  currentBillPaid: z
    .boolean({
      invalid_type_error: 'Current bill paid must be a boolean',
    })
    .optional(),
}).refine(
  (data) => {
    // If account type is credit card, credit card fields are required
    if (data.type === 'credit_card') {
      return (
        data.creditLimit !== undefined &&
        data.paymentDueDate !== undefined &&
        data.billGenerationDate !== undefined &&
        data.creditLimit > 0
      )
    }
    return true
  },
  {
    message: 'Credit limit, payment due date, and bill generation date are required for credit card accounts',
    path: ['creditLimit'],
  }
).refine(
  (data) => {
    // Payment due date and bill generation date should be different
    if (data.type === 'credit_card' && data.paymentDueDate && data.billGenerationDate) {
      return data.paymentDueDate !== data.billGenerationDate
    }
    return true
  },
  {
    message: 'Payment due date and bill generation date should be different',
    path: ['paymentDueDate'],
  }
)

/**
 * Account form data type
 * @description Inferred type from the validation schema
 */
export type AccountFormData = z.infer<typeof accountFormSchema>

/**
 * Account search/filter schema
 * @description Validation for account filtering and search
 */
export const accountFilterSchema = z.object({
  search: z.string().optional(),
  type: z.enum(['all', 'savings', 'checking', 'credit_card', 'investment', 'cash', 'loan', 'other']).optional(),
  status: z.enum(['all', 'active', 'inactive', 'closed']).optional(),
  currency: z.enum(['all', 'INR', 'USD', 'EUR', 'GBP']).optional(),
})

/**
 * Account filter data type
 * @description Inferred type from the filter schema
 */
export type AccountFilterData = z.infer<typeof accountFilterSchema> 