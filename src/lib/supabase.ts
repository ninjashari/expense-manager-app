/**
 * @file supabase.ts
 * @description This file contains the Supabase client configuration.
 * It provides the connection to Supabase for authentication and database operations.
 */
import { createClient } from '@supabase/supabase-js'

/**
 * Supabase configuration
 * @description Environment variables for Supabase connection
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/**
 * Check if Supabase is properly configured
 * @description Validates that required environment variables are set
 */
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'your-supabase-url' && 
  supabaseAnonKey !== 'your-supabase-anon-key'

/**
 * Supabase client instance
 * @description Creates and exports the Supabase client for use throughout the application
 */
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key')

/**
 * Check if Supabase is ready for use
 * @description Returns whether Supabase is properly configured
 */
export const isSupabaseReady = () => isSupabaseConfigured

/**
 * Currency configuration
 * @description Default currency settings for the application
 */
export const DEFAULT_CURRENCY = 'INR'
export const CURRENCY_SYMBOL = '₹'

/**
 * Format currency function
 * @description Formats a number as Indian Rupees
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: DEFAULT_CURRENCY,
    minimumFractionDigits: 2,
  }).format(amount)
} 