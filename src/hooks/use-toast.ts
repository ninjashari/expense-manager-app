/**
 * Toast Hook
 * 
 * A wrapper around sonner toast to provide a consistent interface
 * for displaying toast notifications throughout the application.
 */

import { toast as sonnerToast } from 'sonner';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export function toast({ title, description, variant = 'default', duration }: ToastProps) {
  if (variant === 'destructive') {
    return sonnerToast.error(title || 'Error', {
      description,
      duration,
    });
  }
  
  return sonnerToast.success(title || 'Success', {
    description,
    duration,
  });
}

export function useToast() {
  return {
    toast,
  };
} 