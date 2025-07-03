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
  // Convert string numbers to actual numbers if needed
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Handle invalid numbers
  if (typeof numericAmount !== 'number' || isNaN(numericAmount) || !isFinite(numericAmount)) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(0)
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(numericAmount)
} 