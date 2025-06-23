/**
 * @file payee.ts
 * @description This file contains validation schemas for payee management.
 * It defines Zod schemas for validating payee form data.
 */

import { z } from "zod"

/**
 * Payee form validation schema
 * @description Validates payee creation and update form data
 */
export const payeeFormSchema = z.object({
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(100, "Display name must not exceed 100 characters")
    .regex(/^[a-zA-Z0-9\s\-_&().,]+$/, "Display name can only contain letters, numbers, spaces, hyphens, underscores, ampersands, parentheses, commas, and periods"),
  
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional()
    .or(z.literal("")),
  
  category: z
    .string()
    .max(50, "Category must not exceed 50 characters")
    .optional(),
  
  isActive: z.boolean().optional(),
})

/**
 * Payee form data type inferred from schema
 * @description TypeScript type for payee form validation
 */
export type PayeeFormData = z.infer<typeof payeeFormSchema> 