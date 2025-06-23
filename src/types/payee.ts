/**
 * @file payee.ts
 * @description This file contains type definitions for payee management.
 * It defines the structure and validation for transaction payees.
 */

/**
 * Base payee interface
 * @description Core payee information structure
 */
export interface Payee {
  id: string
  userId: string
  name: string // Auto-generated backend name (slug-like)
  displayName: string // User-provided display name
  description?: string
  category?: string // Optional category for grouping payees
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Payee form data interface
 * @description Structure for payee creation/editing forms
 */
export interface PayeeFormData {
  displayName: string
  description?: string
  category?: string
  isActive?: boolean
}

/**
 * Utility function to generate payee name from display name
 * @description Converts display name to a slug-like payee name
 * @param displayName - User-provided display name
 * @returns Generated payee name
 */
export function generatePayeeName(displayName: string): string {
  return displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

/**
 * Utility function to validate payee display name
 * @description Checks if display name is valid
 * @param displayName - Display name to validate
 * @returns True if valid, false otherwise
 */
export function isValidPayeeDisplayName(displayName: string): boolean {
  return displayName.trim().length >= 2 && displayName.trim().length <= 100
}

/**
 * Common payee categories for UI
 * @description Predefined categories for organizing payees
 */
export const PAYEE_CATEGORIES = [
  { value: 'retail', label: 'Retail & Shopping' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'dining', label: 'Dining & Food' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'services', label: 'Professional Services' },
  { value: 'government', label: 'Government & Taxes' },
  { value: 'financial', label: 'Financial Services' },
  { value: 'personal', label: 'Personal & Family' },
  { value: 'other', label: 'Other' },
] as const

/**
 * Utility function to get payee category label
 * @description Returns human-readable label for payee category
 * @param category - Payee category value
 * @returns Human-readable label
 */
export function getPayeeCategoryLabel(category: string): string {
  return PAYEE_CATEGORIES.find(option => option.value === category)?.label || category
} 