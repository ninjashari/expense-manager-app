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
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Validate that we have a valid date
  if (!dateObj || isNaN(dateObj.getTime())) {
    throw new Error('Invalid date provided to formatDateForDatabase')
  }
  
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
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
    const [year, month, day] = dateInput.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  
  // Handle unexpected input types
  throw new Error(`Invalid date input: expected string or Date, got ${typeof dateInput}`)
}
