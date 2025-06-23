/**
 * @file category.ts
 * @description This file contains validation schemas for category management.
 * It defines Zod schemas for validating category form data.
 */

import { z } from "zod"

/**
 * Category form validation schema
 * @description Validates category creation and update form data
 */
export const categoryFormSchema = z.object({
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must not exceed 50 characters")
    .regex(/^[a-zA-Z0-9\s\-_&()]+$/, "Display name can only contain letters, numbers, spaces, hyphens, underscores, ampersands, and parentheses"),
  
  description: z
    .string()
    .max(200, "Description must not exceed 200 characters")
    .optional()
    .or(z.literal("")),
  
  isActive: z.boolean().optional(),
})

/**
 * Category form data type inferred from schema
 * @description TypeScript type for category form validation
 */
export type CategoryFormData = z.infer<typeof categoryFormSchema> 