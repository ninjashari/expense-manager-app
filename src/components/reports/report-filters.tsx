/**
 * @file report-filters.tsx
 * @description This file contains the comprehensive report filter component.
 * It provides advanced filtering options for generating customized financial reports.
 */

"use client"

import React, { useState, useEffect } from 'react'
import { Calendar, Filter, X, ChevronDown, Search } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Separator } from '@/components/ui/separator'
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

  const handlePresetChange = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setShowCustom(true)
      onDateRangeChange(preset, tempStartDate, tempEndDate)
    } else {
      setShowCustom(false)
      onDateRangeChange(preset)
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
            <SelectValue />
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
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(showAdvanced)

  // Update a specific filter
  const updateFilter = <K extends keyof ReportFilters>(
    key: K,
    value: ReportFilters[K]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  // Reset all filters to defaults
  const resetFilters = () => {
    onFiltersChange(DEFAULT_REPORT_FILTERS)
  }

  // Count active filters
  const activeFilterCount = [
    filters.accountIds.length > 0,
    filters.categoryIds.length > 0,
    filters.payeeIds.length > 0,
    filters.transactionTypes.length !== 3, // Default includes all 3 types
    filters.transactionStatuses.length !== 1, // Default includes only completed
    filters.accountTypes.length > 0,
    filters.minAmount !== undefined,
    filters.maxAmount !== undefined,
    filters.searchTerm && filters.searchTerm.length > 0,
    filters.dateRange !== 'this_month'
  ].filter(Boolean).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Report Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount} active
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Customize your report by applying filters and date ranges
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            >
              {isAdvancedOpen ? 'Basic' : 'Advanced'}
            </Button>
            {activeFilterCount > 0 && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <X className="mr-1 h-3 w-3" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Date Range Selection */}
        <DateRangePicker
          dateRange={filters.dateRange}
          startDate={filters.startDate}
          endDate={filters.endDate}
          onDateRangeChange={(preset, startDate, endDate) => {
            updateFilter('dateRange', preset)
            updateFilter('startDate', startDate)
            updateFilter('endDate', endDate)
          }}
        />

        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Accounts */}
          <div>
            <Label>Accounts</Label>
            <MultiSelect
              items={accounts}
              selectedIds={filters.accountIds}
              onSelectionChange={(ids) => updateFilter('accountIds', ids)}
              getItemId={(account) => account.id}
              getItemLabel={(account) => account.name}
              getItemDescription={(account) => account.type}
              placeholder="All accounts"
              searchPlaceholder="Search accounts..."
              emptyMessage="No accounts found"
            />
          </div>

          {/* Transaction Types */}
          <div>
            <Label>Transaction Types</Label>
            <MultiSelect
              items={TRANSACTION_TYPE_OPTIONS}
              selectedIds={filters.transactionTypes}
              onSelectionChange={(types) => updateFilter('transactionTypes', types as TransactionType[])}
              getItemId={(option) => option.value}
              getItemLabel={(option) => option.label}
              placeholder="All types"
              searchPlaceholder="Search types..."
              emptyMessage="No transaction types found"
            />
          </div>
        </div>

        {/* Advanced Filters */}
        {isAdvancedOpen && (
          <>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Categories */}
              <div>
                <Label>Categories</Label>
                <MultiSelect
                  items={categories}
                  selectedIds={filters.categoryIds}
                  onSelectionChange={(ids) => updateFilter('categoryIds', ids)}
                  getItemId={(category) => category.id}
                  getItemLabel={(category) => category.displayName}
                  placeholder="All categories"
                  searchPlaceholder="Search categories..."
                  emptyMessage="No categories found"
                />
              </div>

              {/* Payees */}
              <div>
                <Label>Payees</Label>
                <MultiSelect
                  items={payees}
                  selectedIds={filters.payeeIds}
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
              <div>
                <Label>Transaction Status</Label>
                <MultiSelect
                  items={TRANSACTION_STATUS_OPTIONS}
                  selectedIds={filters.transactionStatuses}
                  onSelectionChange={(statuses) => updateFilter('transactionStatuses', statuses as TransactionStatus[])}
                  getItemId={(option) => option.value}
                  getItemLabel={(option) => option.label}
                  placeholder="All statuses"
                  searchPlaceholder="Search statuses..."
                  emptyMessage="No statuses found"
                />
              </div>

              {/* Account Types */}
              <div>
                <Label>Account Types</Label>
                <MultiSelect
                  items={ACCOUNT_TYPE_OPTIONS}
                  selectedIds={filters.accountTypes}
                  onSelectionChange={(types) => updateFilter('accountTypes', types as AccountType[])}
                  getItemId={(option) => option.value}
                  getItemLabel={(option) => option.label}
                  placeholder="All account types"
                  searchPlaceholder="Search account types..."
                  emptyMessage="No account types found"
                />
              </div>
            </div>

            {/* Amount Range */}
            <div>
              <Label>Amount Range</Label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div>
                  <Input
                    type="number"
                    placeholder="Min amount"
                    value={filters.minAmount || ''}
                    onChange={(e) => updateFilter('minAmount', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Max amount"
                    value={filters.maxAmount || ''}
                    onChange={(e) => updateFilter('maxAmount', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </div>

            {/* Search */}
            <div>
              <Label>Search</Label>
              <div className="space-y-3">
                <Input
                  placeholder="Search transactions..."
                  value={filters.searchTerm || ''}
                  onChange={(e) => updateFilter('searchTerm', e.target.value)}
                />
                <div className="flex items-center space-x-2">
                  <Switch
                    id="include-notes"
                    checked={filters.includeNotes}
                    onCheckedChange={(checked) => updateFilter('includeNotes', checked)}
                  />
                  <Label htmlFor="include-notes" className="text-sm font-normal">
                    Include notes in search
                  </Label>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Filter Summary */}
        {activeFilterCount > 0 && (
          <>
            <Separator />
            <div>
              <Label className="text-sm text-muted-foreground">Active Filters Summary</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {filters.accountIds.length > 0 && (
                  <Badge variant="outline">
                    {filters.accountIds.length} Account{filters.accountIds.length !== 1 ? 's' : ''}
                  </Badge>
                )}
                {filters.categoryIds.length > 0 && (
                  <Badge variant="outline">
                    {filters.categoryIds.length} Categor{filters.categoryIds.length !== 1 ? 'ies' : 'y'}
                  </Badge>
                )}
                {filters.payeeIds.length > 0 && (
                  <Badge variant="outline">
                    {filters.payeeIds.length} Payee{filters.payeeIds.length !== 1 ? 's' : ''}
                  </Badge>
                )}
                {filters.minAmount !== undefined && (
                  <Badge variant="outline">Min: ₹{filters.minAmount}</Badge>
                )}
                {filters.maxAmount !== undefined && (
                  <Badge variant="outline">Max: ₹{filters.maxAmount}</Badge>
                )}
                {filters.searchTerm && (
                  <Badge variant="outline">Search: &quot;{filters.searchTerm}&quot;</Badge>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
} 