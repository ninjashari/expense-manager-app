/**
 * @file report-filters.tsx
 * @description This file contains the comprehensive report filter component.
 * It provides advanced filtering options for generating customized financial reports.
 */

"use client"

import React, { useState, useEffect } from 'react'
import { Calendar, X, ChevronDown, Search } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Switch } from '@/components/ui/switch'

import { Account, ACCOUNT_TYPE_OPTIONS, AccountType } from '@/types/account'
import { Category } from '@/types/category'
import { Payee } from '@/types/payee'
import { TRANSACTION_TYPE_OPTIONS, TRANSACTION_STATUS_OPTIONS, TransactionType, TransactionStatus } from '@/types/transaction'
import type {
  ReportFilters,
  DateRangePreset,
} from '@/types/report'
import {
  DATE_RANGE_PRESETS,
  DEFAULT_REPORT_FILTERS
} from '@/types/report'

/**
 * Props interface for the ReportFilters component
 * @description Defines the props required for the report filters
 */
interface ReportFiltersProps {
  /**
   * Current filter values
   */
  filters: ReportFilters
  /**
   * Available accounts for filtering
   */
  accounts: Account[]
  /**
   * Available categories for filtering
   */
  categories: Category[]
  /**
   * Available payees for filtering
   */
  payees: Payee[]
  /**
   * Callback function called when filters change
   * @param filters - Updated filter values
   */
  onFiltersChange: (filters: ReportFilters) => void
  /**
   * Loading state indicator
   */
  isLoading?: boolean
  /**
   * Whether to show advanced filters
   */
  showAdvanced?: boolean
}

/**
 * Multi-select dropdown component for entities
 * @description Reusable component for selecting multiple items
 */
interface MultiSelectProps<T> {
  items: readonly T[]
  selectedIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
  getItemId: (item: T) => string
  getItemLabel: (item: T) => string
  getItemDescription?: (item: T) => string
  placeholder: string
  searchPlaceholder: string
  emptyMessage: string
}

function MultiSelect<T>({
  items,
  selectedIds,
  onSelectionChange,
  getItemId,
  getItemLabel,
  getItemDescription,
  placeholder,
  searchPlaceholder,
  emptyMessage
}: MultiSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredItems = items.filter(item =>
    getItemLabel(item).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (getItemDescription?.(item) || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedItems = items.filter(item => selectedIds.includes(getItemId(item)))

  const toggleSelection = (itemId: string) => {
    const newSelection = selectedIds.includes(itemId)
      ? selectedIds.filter(id => id !== itemId)
      : [...selectedIds, itemId]
    onSelectionChange(newSelection)
  }

  const clearAll = () => {
    onSelectionChange([])
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-left font-normal"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedItems.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : selectedItems.length === 1 ? (
              <span className="truncate">{getItemLabel(selectedItems[0])}</span>
            ) : (
              <span>{selectedItems.length} selected</span>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <div className="flex items-center px-3 py-2 border-b">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
            {selectedIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="ml-2 h-6 px-2 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
          <CommandList>
            {filteredItems.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              <CommandGroup>
                {filteredItems.map((item) => {
                  const itemId = getItemId(item)
                  const isSelected = selectedIds.includes(itemId)
                  
                  return (
                    <CommandItem
                      key={itemId}
                      onSelect={() => toggleSelection(itemId)}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleSelection(itemId)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{getItemLabel(item)}</div>
                        {getItemDescription && (
                          <div className="text-sm text-muted-foreground truncate">
                            {getItemDescription(item)}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Date range picker component
 * @description Handles date range selection with presets and custom dates
 */
interface DateRangePickerProps {
  dateRange: DateRangePreset
  startDate?: Date
  endDate?: Date
  onDateRangeChange: (preset: DateRangePreset, startDate?: Date, endDate?: Date) => void
}

function DateRangePicker({ dateRange, startDate, endDate, onDateRangeChange }: DateRangePickerProps) {
  const [showCustom, setShowCustom] = useState(dateRange === 'custom')
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(startDate)
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(endDate)

  useEffect(() => {
    setShowCustom(dateRange === 'custom')
  }, [dateRange])

  // Update temp dates when external dates change
  useEffect(() => {
    setTempStartDate(startDate)
  }, [startDate])

  useEffect(() => {
    setTempEndDate(endDate)
  }, [endDate])

  const handlePresetChange = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setShowCustom(true)
      onDateRangeChange(preset, tempStartDate, tempEndDate)
    } else {
      setShowCustom(false)
      // Clear startDate and endDate for preset ranges
      onDateRangeChange(preset, undefined, undefined)
    }
  }

  const handleCustomDateChange = () => {
    if (tempStartDate && tempEndDate) {
      onDateRangeChange('custom', tempStartDate, tempEndDate)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Date Range</Label>
        <Select value={dateRange} onValueChange={handlePresetChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGE_PRESETS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showCustom && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  {tempStartDate ? format(tempStartDate, 'MMM dd, yyyy') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={tempStartDate}
                  onSelect={(date) => {
                    setTempStartDate(date)
                    if (date && tempEndDate) {
                      handleCustomDateChange()
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  {tempEndDate ? format(tempEndDate, 'MMM dd, yyyy') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={tempEndDate}
                  onSelect={(date) => {
                    setTempEndDate(date)
                    if (tempStartDate && date) {
                      handleCustomDateChange()
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * ReportFilters component
 * @description Main report filters component with comprehensive filtering options
 */
export function ReportFilters({
  filters,
  accounts,
  categories,
  payees,
  onFiltersChange,
  showAdvanced = false
}: ReportFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(showAdvanced)

  // Update local filters when external filters change
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const updateFilter = <K extends keyof ReportFilters>(
    key: K,
    value: ReportFilters[K]
  ) => {
    const newFilters = { ...localFilters, [key]: value }

    if (key === 'dateRangePreset') {
      const preset = value as DateRangePreset
      if (preset !== 'custom') {
        newFilters.startDate = undefined
        newFilters.endDate = undefined
      }
    }

    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const resetFilters = () => {
    const defaultFilters = { ...DEFAULT_REPORT_FILTERS }
    setLocalFilters(defaultFilters)
    onFiltersChange(defaultFilters)
  }
  
  const activeFilterCount = [
    localFilters.accountIds.length > 0,
    localFilters.categoryIds.length > 0,
    localFilters.payeeIds.length > 0,
    localFilters.transactionTypes.length > 0,
    localFilters.transactionStatuses.length > 0,
    localFilters.minAmount !== undefined,
    localFilters.maxAmount !== undefined,
    localFilters.searchTerm && localFilters.searchTerm.length > 0,
    localFilters.dateRangePreset !== 'this_financial_year'
  ].filter(Boolean).length

  return (
    <Card className="bg-background/50 backdrop-blur-lg border-dashed">
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-foreground">Report Filters</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="advanced-filters" className="text-sm font-normal">
                Advanced
              </Label>
              <Switch
                id="advanced-filters"
                checked={isAdvancedOpen}
                onCheckedChange={setIsAdvancedOpen}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-sm">
              <X className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
        {activeFilterCount > 0 && (
          <CardDescription>
            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <DateRangePicker
              dateRange={localFilters.dateRangePreset}
              startDate={localFilters.startDate}
              endDate={localFilters.endDate}
              onDateRangeChange={(preset, start, end) => {
                const newFilters: ReportFilters = {
                  ...localFilters,
                  dateRangePreset: preset,
                  startDate: start,
                  endDate: end,
                }
                setLocalFilters(newFilters)
                onFiltersChange(newFilters)
              }}
            />
          </div>

          {/* Transaction Type */}
          <div className="space-y-2">
            <Label>Transaction Types</Label>
            <MultiSelect
              items={TRANSACTION_TYPE_OPTIONS}
              selectedIds={localFilters.transactionTypes}
              onSelectionChange={(types) => updateFilter('transactionTypes', types as TransactionType[])}
              getItemId={(option) => option.value}
              getItemLabel={(option) => option.label}
              placeholder="All types"
              searchPlaceholder="Search types..."
              emptyMessage="No transaction types found"
            />
          </div>

          {/* Accounts */}
          <div className="space-y-2">
            <Label>Accounts</Label>
            <MultiSelect
              items={accounts}
              selectedIds={localFilters.accountIds}
              onSelectionChange={(ids) => updateFilter('accountIds', ids)}
              getItemId={(account) => account.id}
              getItemLabel={(account) => account.name}
              getItemDescription={(account) => account.type}
              placeholder="All accounts"
              searchPlaceholder="Search accounts..."
              emptyMessage="No accounts found"
            />
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label>Categories</Label>
            <MultiSelect
              items={categories}
              selectedIds={localFilters.categoryIds}
              onSelectionChange={(ids) => updateFilter('categoryIds', ids)}
              getItemId={(category) => category.id}
              getItemLabel={(category) => category.displayName}
              placeholder="All categories"
              searchPlaceholder="Search categories..."
              emptyMessage="No categories found"
            />
          </div>

          {/* Payees */}
          <div className="space-y-2">
            <Label>Payees</Label>
            <MultiSelect
              items={payees}
              selectedIds={localFilters.payeeIds}
              onSelectionChange={(ids) => updateFilter('payeeIds', ids)}
              getItemId={(payee) => payee.id}
              getItemLabel={(payee) => payee.displayName}
              getItemDescription={(payee) => payee.category || ''}
              placeholder="All payees"
              searchPlaceholder="Search payees..."
              emptyMessage="No payees found"
            />
          </div>

          {/* Transaction Status */}
          <div className="space-y-2">
            <Label>Transaction Status</Label>
            <MultiSelect
              items={TRANSACTION_STATUS_OPTIONS}
              selectedIds={localFilters.transactionStatuses}
              onSelectionChange={(statuses) => updateFilter('transactionStatuses', statuses as TransactionStatus[])}
              getItemId={(option) => option.value}
              getItemLabel={(option) => option.label}
              placeholder="All statuses"
              searchPlaceholder="Search statuses..."
              emptyMessage="No statuses found"
            />
          </div>

          {/* Account Types */}
          <div className="space-y-2">
            <Label>Account Types</Label>
            <MultiSelect
              items={ACCOUNT_TYPE_OPTIONS}
              selectedIds={localFilters.accountTypes}
              onSelectionChange={(types) => updateFilter('accountTypes', types as AccountType[])}
              getItemId={(option) => option.value}
              getItemLabel={(option) => option.label}
              placeholder="All account types"
              searchPlaceholder="Search account types..."
              emptyMessage="No account types found"
            />
          </div>

          {/* Amount Range */}
          <div className="space-y-2">
            <Label>Amount Range</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  type="number"
                  placeholder="Min amount"
                  value={localFilters.minAmount || ''}
                  onChange={(e) => updateFilter('minAmount', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Max amount"
                  value={localFilters.maxAmount || ''}
                  onChange={(e) => updateFilter('maxAmount', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label>Search</Label>
            <div className="space-y-3">
              <Input
                placeholder="Search transactions..."
                value={localFilters.searchTerm || ''}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
              />
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-notes"
                  checked={localFilters.includeNotes}
                  onCheckedChange={(checked) => updateFilter('includeNotes', checked)}
                />
                <Label htmlFor="include-notes" className="text-sm font-normal">
                  Include notes in search
                </Label>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 