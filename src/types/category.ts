/**
 * @file category.ts
 * @description This file contains type definitions for category management.
 * It defines the structure and validation for expense categories.
 */

/**
 * Base category interface
 * @description Core category information structure
 */
export interface Category {
  id: string
  userId: string
  name: string // Auto-generated backend name (slug-like)
  displayName: string // User-provided display name
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Category form data interface
 * @description Structure for category creation/editing forms
 */
export interface CategoryFormData {
  displayName: string
  description?: string
  isActive?: boolean
}

/**
 * Utility function to generate category name from display name
 * @description Converts display name to a slug-like category name
 * @param displayName - User-provided display name
 * @returns Generated category name
 */
export function generateCategoryName(displayName: string): string {
  return displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

/**
 * Utility function to validate category display name
 * @description Checks if display name is valid
 * @param displayName - Display name to validate
 * @returns True if valid, false otherwise
 */
export function isValidCategoryDisplayName(displayName: string): boolean {
  return displayName.trim().length >= 2 && displayName.trim().length <= 50
} 