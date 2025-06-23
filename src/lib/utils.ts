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
 * @description Converts a Date object to YYYY-MM-DD format using local timezone
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForDatabase(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse date from database string
 * @description Converts YYYY-MM-DD string to Date object in local timezone
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object
 */
export function parseDateFromDatabase(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}
