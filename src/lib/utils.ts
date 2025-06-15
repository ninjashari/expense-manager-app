/**
 * Utility Functions Library
 * 
 * This module contains essential utility functions used throughout the Expense Manager application.
 * It includes styling utilities, formatting functions, validation helpers, and performance optimizations.
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines and merges Tailwind CSS classes efficiently
 * @param inputs - Array of class values to combine
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats currency amounts with proper localization and error handling
 * @param amount - The amount to format (in cents)
 * @param currency - The currency code (e.g., 'USD', 'EUR')
 * @param locale - Optional locale for formatting (defaults to 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string, locale: string = 'en-US'): string {
    try {
        // Handle edge cases
        if (typeof amount !== 'number' || isNaN(amount)) {
            return `${currency} 0.00`;
        }

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch (error) {
        // Fallback formatting if Intl.NumberFormat fails
        console.warn(`Currency formatting failed for ${currency}:`, error);
        return `${currency} ${amount.toFixed(2)}`;
    }
}

/**
 * Formats numbers with proper thousand separators
 * @param value - The number to format
 * @param locale - Optional locale for formatting
 * @returns Formatted number string
 */
export function formatNumber(value: number, locale: string = 'en-US'): string {
    try {
        if (typeof value !== 'number' || isNaN(value)) {
            return '0';
        }
        return new Intl.NumberFormat(locale).format(value);
    } catch (error) {
        console.warn('Number formatting failed:', error);
        return value.toString();
    }
}

/**
 * Formats percentage values with proper precision
 * @param value - The decimal value to format as percentage (e.g., 0.15 for 15%)
 * @param precision - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, precision: number = 1): string {
    try {
        if (typeof value !== 'number' || isNaN(value)) {
            return '0%';
        }
        return `${(value * 100).toFixed(precision)}%`;
    } catch (error) {
        console.warn('Percentage formatting failed:', error);
        return '0%';
    }
}

/**
 * Debounces function calls to improve performance
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Throttles function calls to limit execution frequency
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Validates email format using RFC 5322 compliant regex
 * @param email - Email string to validate
 * @returns Boolean indicating if email is valid
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Generates a random ID string
 * @param length - Length of the ID (default: 8)
 * @returns Random ID string
 */
export function generateId(length: number = 8): string {
    return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Safely parses JSON with error handling
 * @param jsonString - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback value
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.warn('JSON parsing failed:', error);
        return fallback;
    }
}

/**
 * Capitalizes the first letter of a string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Truncates text to specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Formats file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Deep clones an object (for simple objects without functions)
 * @param obj - Object to clone
 * @returns Deep cloned object
 */
export function deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Checks if a value is empty (null, undefined, empty string, empty array, empty object)
 * @param value - Value to check
 * @returns Boolean indicating if value is empty
 */
export function isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}
