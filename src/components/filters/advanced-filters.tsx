/**
 * Advanced Filters Component
 * 
 * This component provides a comprehensive filtering interface for transactions
 * and bills. It includes date range selection, account/category filtering,
 * amount range filtering, and search functionality with real-time updates.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Filter, X, Search, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

/**
 * Filter state interface for managing all filter options
 */
export interface FilterState {
  dateRange?: DateRange;
  accountIds: string[];
  categoryIds: string[];
  transactionType?: 'income' | 'expense' | 'transfer';
  amountRange?: {
    min?: number;
    max?: number;
  };
  payee?: string;
  notes?: string;
  status?: string[];
}

/**
 * Props interface for the AdvancedFilters component
 */
interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
  showTransactionType?: boolean;
  showStatus?: boolean;
  statusOptions?: Array<{ value: string; label: string }>;
}

/**
 * Main Advanced Filters Component
 * 
 * Provides comprehensive filtering capabilities including:
 * - Date range selection with calendar picker
 * - Multi-select account and category filters
 * - Amount range filtering with min/max inputs
 * - Text search for payee and notes
 * - Transaction type and status filtering
 * - Real-time filter updates and validation
 */
export function AdvancedFilters({
  filters,
  onFiltersChange,
  className = '',
  showTransactionType = true,
  showStatus = false,
  statusOptions = [],
}: AdvancedFiltersProps) {
  // Local state for form inputs
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch accounts for filter options
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await fetch('/api/accounts');
      if (!response.ok) throw new Error('Failed to fetch accounts');
      return response.json();
    },
  });

  // Fetch categories for filter options
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });

  // Memoized callback for filter changes
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    onFiltersChange(newFilters);
  }, [onFiltersChange]);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Apply filters with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleFiltersChange(localFilters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localFilters, handleFiltersChange]);

  // Handle date range changes
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setLocalFilters(prev => ({
      ...prev,
      dateRange: range,
    }));
  };

  // Handle account selection
  const handleAccountToggle = (accountId: string) => {
    setLocalFilters(prev => ({
      ...prev,
      accountIds: prev.accountIds.includes(accountId)
        ? prev.accountIds.filter(id => id !== accountId)
        : [...prev.accountIds, accountId],
    }));
  };

  // Handle category selection
  const handleCategoryToggle = (categoryId: string) => {
    setLocalFilters(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  // Handle amount range changes
  const handleAmountRangeChange = (field: 'min' | 'max', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    setLocalFilters(prev => ({
      ...prev,
      amountRange: {
        ...prev.amountRange,
        [field]: numValue,
      },
    }));
  };

  // Handle status selection
  const handleStatusToggle = (status: string) => {
    setLocalFilters(prev => ({
      ...prev,
      status: prev.status?.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...(prev.status || []), status],
    }));
  };

  // Clear all filters
  const handleClearAll = () => {
    const clearedFilters: FilterState = {
      accountIds: [],
      categoryIds: [],
      status: [],
    };
    setLocalFilters(clearedFilters);
    setSearchTerm('');
  };

  // Filter accounts and categories based on search
  const filteredAccounts = accounts.filter((account: { name: string }) =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCategories = categories.filter((category: { name: string }) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Count active filters
  const activeFilterCount = [
    localFilters.dateRange?.from && localFilters.dateRange?.to ? 1 : 0,
    localFilters.accountIds.length,
    localFilters.categoryIds.length,
    localFilters.transactionType ? 1 : 0,
    localFilters.amountRange?.min || localFilters.amountRange?.max ? 1 : 0,
    localFilters.payee ? 1 : 0,
    localFilters.notes ? 1 : 0,
    localFilters.status?.length || 0,
  ].reduce((sum, count) => sum + count, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Advanced Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Filter your data with advanced criteria
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !localFilters.dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localFilters.dateRange?.from ? (
                    localFilters.dateRange.to ? (
                      <>
                        {format(localFilters.dateRange.from, "LLL dd, y")} -{" "}
                        {format(localFilters.dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(localFilters.dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={localFilters.dateRange?.from}
                  selected={localFilters.dateRange}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Account Filter */}
          <div className="space-y-2">
            <Label>Accounts</Label>
            <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
              <div className="mb-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search accounts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                {filteredAccounts.map((account: { _id: string; name: string; type: string }) => (
                  <div key={account._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`account-${account._id}`}
                      checked={localFilters.accountIds.includes(account._id)}
                      onCheckedChange={() => handleAccountToggle(account._id)}
                    />
                    <Label
                      htmlFor={`account-${account._id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {account.name}
                      <span className="text-muted-foreground ml-1">({account.type})</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <Label>Categories</Label>
            <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
              <div className="space-y-2">
                {filteredCategories.map((category: { _id: string; name: string; type: string }) => (
                  <div key={category._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category._id}`}
                      checked={localFilters.categoryIds.includes(category._id)}
                      onCheckedChange={() => handleCategoryToggle(category._id)}
                    />
                    <Label
                      htmlFor={`category-${category._id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {category.name}
                      <span className="text-muted-foreground ml-1">({category.type})</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transaction Type Filter */}
          {showTransactionType && (
            <div className="space-y-2">
              <Label>Transaction Type</Label>
              <Select
                value={localFilters.transactionType || ''}
                onValueChange={(value) =>
                  setLocalFilters(prev => ({
                    ...prev,
                    transactionType: value === '' ? undefined : value as 'income' | 'expense' | 'transfer',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount Range Filter */}
          <div className="space-y-2">
            <Label>Amount Range</Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Min amount"
                  value={localFilters.amountRange?.min || ''}
                  onChange={(e) => handleAmountRangeChange('min', e.target.value)}
                  className="pl-8"
                />
              </div>
              <span className="text-muted-foreground">to</span>
              <div className="relative flex-1">
                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Max amount"
                  value={localFilters.amountRange?.max || ''}
                  onChange={(e) => handleAmountRangeChange('max', e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {/* Status Filter */}
          {showStatus && statusOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="border rounded-md p-3">
                <div className="space-y-2">
                  {statusOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${option.value}`}
                        checked={localFilters.status?.includes(option.value) || false}
                        onCheckedChange={() => handleStatusToggle(option.value)}
                      />
                      <Label
                        htmlFor={`status-${option.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Text Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payee">Payee</Label>
              <Input
                id="payee"
                placeholder="Search by payee..."
                value={localFilters.payee || ''}
                onChange={(e) =>
                  setLocalFilters(prev => ({
                    ...prev,
                    payee: e.target.value || undefined,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Search in notes..."
                value={localFilters.notes || ''}
                onChange={(e) =>
                  setLocalFilters(prev => ({
                    ...prev,
                    notes: e.target.value || undefined,
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
} 