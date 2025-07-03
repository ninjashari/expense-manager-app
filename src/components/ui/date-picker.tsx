/**
 * @file date-picker.tsx
 * @description This file contains a DatePicker component for date selection.
 * It provides a clean interface for date input with proper formatting.
 */
'use client'

import React from 'react'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/**
 * DatePicker component props interface
 * @description Properties for the DatePicker component
 */
interface DatePickerProps {
  date?: Date
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

/**
 * DatePicker component
 * @description A date picker component with calendar popup
 * @param date - Selected date
 * @param onDateChange - Callback function when date changes
 * @param placeholder - Placeholder text when no date is selected
 * @param className - Additional CSS classes
 * @param disabled - Whether the date picker is disabled
 * @returns DatePicker component
 */
export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  disabled = false
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
} 