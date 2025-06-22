/**
 * @file utils.ts
 * @description This file contains utility functions for the application.
 * The `cn` function is a helper to merge Tailwind CSS classes with clsx.
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
