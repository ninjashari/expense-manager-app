/**
 * @file utils.ts
 * @description This file contains utility functions for the application.
 * The `cn` function is a helper to merge Tailwind CSS classes with clsx.
 */
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date for database storage without timezone issues
 * @description Converts a Date object or date string to YYYY-MM-DD format using local timezone
 * @param date - Date object or ISO date string to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForDatabase(date: Date | string): string {
  // Handle string input (ISO date string from JSON serialization)
  if (typeof date === 'string') {
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date
    }
    
    // If it's an ISO string, parse it carefully to avoid timezone issues
    if (date.includes('T') || date.includes('Z')) {
      // Extract date part from ISO string to avoid timezone conversion
      const datePart = date.split('T')[0]
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        return datePart
      }
    }
    
    // Fallback to Date parsing with timezone correction
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date string provided to formatDateForDatabase')
    }
    
    // Get the timezone offset and adjust for local date
    const timezoneOffset = dateObj.getTimezoneOffset()
    const localDate = new Date(dateObj.getTime() - (timezoneOffset * 60 * 1000))
    
    const year = localDate.getUTCFullYear()
    const month = String(localDate.getUTCMonth() + 1).padStart(2, '0')
    const day = String(localDate.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  // Handle Date object input
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided to formatDateForDatabase')
  }
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse date from database string or Date object
 * @description Converts YYYY-MM-DD string or Date object to Date object in local timezone
 * @param dateInput - Date string in YYYY-MM-DD format or Date object
 * @returns Date object
 */
export function parseDateFromDatabase(dateInput: string | Date): Date {
  // If it's already a Date object, return it as is
  if (dateInput instanceof Date) {
    return dateInput
  }
  
  // If it's a string, parse it
  if (typeof dateInput === 'string') {
    // Handle YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [year, month, day] = dateInput.split('-').map(Number)
      return new Date(year, month - 1, day)
    }
    
    // Handle ISO date strings by extracting date part
    if (dateInput.includes('T') || dateInput.includes('Z')) {
      const datePart = dateInput.split('T')[0]
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        const [year, month, day] = datePart.split('-').map(Number)
        return new Date(year, month - 1, day)
      }
    }
    
    // Fallback to regular Date parsing
    const date = new Date(dateInput)
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date string: ${dateInput}`)
    }
    return date
  }
  
  // Handle unexpected input types
  throw new Error(`Invalid date input: expected string or Date, got ${typeof dateInput}`)
}

/**
 * Safe date parsing with fallback
 * @description Safely parses a date string with fallback to current date
 * @param dateString - Date string to parse
 * @param fallback - Optional fallback date (defaults to current date)
 * @returns Valid Date object
 */
export function safeParseDateString(dateString: string, fallback?: Date): Date {
  try {
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? (fallback || new Date()) : date
  } catch (error) {
    console.error('Error parsing date string:', error, 'Input:', dateString)
    return fallback || new Date()
  }
}

/**
 * Format date for display with error handling
 * @description Formats a date for display with comprehensive error handling
 * @param date - Date to format (Date object or string)
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string or fallback text
 */
export function formatDateSafely(
  date: Date | string, 
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  try {
    // Handle both Date objects and date strings
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Check if date is valid
    if (!dateObj || isNaN(dateObj.getTime())) {
      return 'Invalid date'
    }
    
    return new Intl.DateTimeFormat('en-US', options).format(dateObj)
  } catch (error) {
    console.error('Error formatting date:', error, 'Date value:', date)
    return 'Invalid date'
  }
}
