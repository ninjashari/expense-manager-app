/**
 * @file currency.ts
 * @description This file contains currency formatting utilities.
 * It provides currency formatting functions for the expense management application.
 */

/**
 * Currency configuration
 * @description Default currency settings for the application
 */
export const DEFAULT_CURRENCY = 'INR'
export const CURRENCY_SYMBOL = '₹'

/**
 * Currency formatting utility
 * @description Formats currency values for display
 * @param amount - Amount to format
 * @param currency - Currency code (default: INR)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount)
} 