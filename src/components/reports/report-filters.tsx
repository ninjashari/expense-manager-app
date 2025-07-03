/**
 * @file report-filters.tsx
 * @description This file contains the comprehensive report filter component.
 * It provides advanced filtering options for generating customized financial reports.
 */

"use client"

import React, { useState } from 'react'
import { X, ChevronDown, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
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
  onDateRangeChange: (preset: DateRangePreset) => void
}

function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  return (
    <Select value={dateRange} onValueChange={onDateRangeChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select date range" />
      </SelectTrigger>
      <SelectContent>
        {DATE_RANGE_PRESETS.map(preset => (
          <SelectItem key={preset.value} value={preset.value}>
            {preset.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * ReportFilters component
 * @description Main component for rendering the entire filter section
 */
export function ReportFilters({
  filters,
  accounts,
  categories,
  payees,
  onFiltersChange,
  showAdvanced = false
}: ReportFiltersProps) {
  const [advanced, setAdvanced] = useState(showAdvanced)

  const updateFilter = <K extends keyof ReportFilters>(
    key: K,
    value: ReportFilters[K]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const resetFilters = () => {
    onFiltersChange(DEFAULT_REPORT_FILTERS)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>
            {Object.values(filters).filter(v => Array.isArray(v) ? v.length > 0 : v).length} filters applied
          </CardDescription>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="advanced-filters" className="text-sm font-medium">Advanced</Label>
            <Switch
              id="advanced-filters"
              checked={advanced}
              onCheckedChange={setAdvanced}
            />
          </div>
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-sm">
            <X className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <DateRangePicker
              dateRange={filters.dateRangePreset}
              onDateRangeChange={(preset) => {
                onFiltersChange({
                  ...filters,
                  dateRangePreset: preset,
                  startDate: undefined,
                  endDate: undefined,
                })
              }}
            />
          </div>

          {/* Transaction Types Filter */}
          <div className="space-y-2">
            <Label>Transaction Types</Label>
            <MultiSelect
              items={TRANSACTION_TYPE_OPTIONS}
              selectedIds={filters.transactionTypes}
              onSelectionChange={(types) => updateFilter('transactionTypes', types as TransactionType[])}
              getItemId={(option) => option.value}
              getItemLabel={(option) => option.label}
              placeholder="Select transaction types"
              searchPlaceholder="Search types..."
              emptyMessage="No transaction types found."
            />
          </div>

          {/* Accounts Filter */}
          <div className="space-y-2">
            <Label>Accounts</Label>
            <MultiSelect
              items={accounts}
              selectedIds={filters.accountIds}
              onSelectionChange={(ids) => updateFilter('accountIds', ids)}
              getItemId={(account) => account.id}
              getItemLabel={(account) => account.name}
              placeholder="Select accounts"
              searchPlaceholder="Search accounts..."
              emptyMessage="No accounts found."
            />
          </div>

          {/* Categories Filter */}
          <div className="space-y-2">
            <Label>Categories</Label>
            <MultiSelect
              items={categories}
              selectedIds={filters.categoryIds}
              onSelectionChange={(ids) => updateFilter('categoryIds', ids)}
              getItemId={(category) => category.id}
              getItemLabel={(category) => category.displayName}
              placeholder="Select categories"
              searchPlaceholder="Search categories..."
              emptyMessage="No categories found."
            />
          </div>

          {advanced && (
            <>
              {/* Payees Filter */}
              <div className="space-y-2">
                <Label>Payees</Label>
                <MultiSelect
                  items={payees}
                  selectedIds={filters.payeeIds}
                  onSelectionChange={(ids) => updateFilter('payeeIds', ids)}
                  getItemId={(payee) => payee.id}
                  getItemLabel={(payee) => payee.displayName}
                  placeholder="Select payees"
                  searchPlaceholder="Search payees..."
                  emptyMessage="No payees found."
                />
              </div>

              {/* Transaction Status Filter */}
              <div className="space-y-2">
                <Label>Transaction Status</Label>
                <MultiSelect
                  items={TRANSACTION_STATUS_OPTIONS}
                  selectedIds={filters.transactionStatuses}
                  onSelectionChange={(statuses) => updateFilter('transactionStatuses', statuses as TransactionStatus[])}
                  getItemId={(option) => option.value}
                  getItemLabel={(option) => option.label}
                  placeholder="Select statuses"
                  searchPlaceholder="Search statuses..."
                  emptyMessage="No statuses found."
                />
              </div>

              {/* Account Types Filter */}
              <div className="space-y-2">
                <Label>Account Types</Label>
                <MultiSelect
                  items={ACCOUNT_TYPE_OPTIONS}
                  selectedIds={filters.accountTypes}
                  onSelectionChange={(types) => updateFilter('accountTypes', types as AccountType[])}
                  getItemId={(option) => option.value}
                  getItemLabel={(option) => option.label}
                  placeholder="Select account types"
                  searchPlaceholder="Search account types..."
                  emptyMessage="No account types found."
                />
              </div>

              {/* Amount Range Filter */}
              <div className="space-y-2">
                <Label>Amount Range</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min amount"
                    value={filters.minAmount || ''}
                    onChange={(e) => updateFilter('minAmount', e.target.value ? Number(e.target.value) : undefined)}
                  />
                  <Input
                    type="number"
                    placeholder="Max amount"
                    value={filters.maxAmount || ''}
                    onChange={(e) => updateFilter('maxAmount', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Search Filter */}
          <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-4">
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
        </div>
      </CardContent>
    </Card>
  )
} 