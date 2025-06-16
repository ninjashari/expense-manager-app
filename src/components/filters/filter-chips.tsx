/**
 * Filter Chips Component
 * 
 * This component displays active filters as removable chips/badges.
 * It provides a visual representation of applied filters and allows
 * users to quickly remove individual filters.
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Calendar, CreditCard, Tag, DollarSign, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { FilterState } from './advanced-filters';

// Props interface for the component
interface FilterChipsProps {
  filters: FilterState;
  onRemoveFilter: (filterKey: keyof FilterState, value?: string) => void;
  onClearAll: () => void;
  accounts?: Array<{ _id: string; name: string }>;
  categories?: Array<{ _id: string; name: string }>;
  className?: string;
}

/**
 * Individual filter chip component
 * Displays a single filter with remove functionality
 */
interface FilterChipProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  onRemove: () => void;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const FilterChip: React.FC<FilterChipProps> = ({
  label,
  value,
  icon,
  onRemove,
  variant = 'secondary',
}) => (
  <Badge variant={variant} className="flex items-center gap-1 pr-1 text-xs">
    {icon}
    <span className="font-medium">{label}:</span>
    <span className="truncate max-w-32">{value}</span>
    <Button
      variant="ghost"
      size="sm"
      className="h-4 w-4 p-0 hover:bg-transparent"
      onClick={onRemove}
    >
      <X className="h-3 w-3" />
    </Button>
  </Badge>
);

/**
 * Main FilterChips component
 * Renders all active filters as removable chips
 */
export const FilterChips: React.FC<FilterChipsProps> = ({
  filters,
  onRemoveFilter,
  onClearAll,
  accounts = [],
  categories = [],
  className = '',
}) => {
  const { data: session } = useSession();
  const currency = session?.user?.currency || 'INR';

  // Helper function to get account name by ID
  const getAccountName = (accountId: string): string => {
    const account = accounts.find(acc => acc._id === accountId);
    return account?.name || 'Unknown Account';
  };

  // Helper function to get category name by ID
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(cat => cat._id === categoryId);
    return category?.name || 'Unknown Category';
  };

  // Generate filter chips based on active filters
  const filterChips: React.ReactNode[] = [];

  // Date Range Filter
  if (filters.dateRange?.from && filters.dateRange?.to) {
    const fromDate = format(filters.dateRange.from, 'MMM dd, yyyy');
    const toDate = format(filters.dateRange.to, 'MMM dd, yyyy');
    const dateRangeText = fromDate === toDate ? fromDate : `${fromDate} - ${toDate}`;
    
    filterChips.push(
      <FilterChip
        key="dateRange"
        label="Date Range"
        value={dateRangeText}
        icon={<Calendar className="h-3 w-3" />}
        onRemove={() => onRemoveFilter('dateRange')}
      />
    );
  }

  // Account Filters
  filters.accountIds.forEach((accountId) => {
    filterChips.push(
      <FilterChip
        key={`account-${accountId}`}
        label="Account"
        value={getAccountName(accountId)}
        icon={<CreditCard className="h-3 w-3" />}
        onRemove={() => onRemoveFilter('accountIds', accountId)}
      />
    );
  });

  // Category Filters
  filters.categoryIds.forEach((categoryId) => {
    filterChips.push(
      <FilterChip
        key={`category-${categoryId}`}
        label="Category"
        value={getCategoryName(categoryId)}
        icon={<Tag className="h-3 w-3" />}
        onRemove={() => onRemoveFilter('categoryIds', categoryId)}
      />
    );
  });

  // Transaction Type Filter
  if (filters.transactionType) {
    filterChips.push(
      <FilterChip
        key="transactionType"
        label="Type"
        value={filters.transactionType}
        icon={<Tag className="h-3 w-3" />}
        onRemove={() => onRemoveFilter('transactionType')}
      />
    );
  }

  // Amount Range Filters
  if (filters.amountRange?.min !== undefined || filters.amountRange?.max !== undefined) {
    let amountText = '';
    if (filters.amountRange?.min !== undefined && filters.amountRange?.max !== undefined) {
      amountText = `${formatCurrency(filters.amountRange.min / 100, currency)} - ${formatCurrency(filters.amountRange.max / 100, currency)}`;
    } else if (filters.amountRange?.min !== undefined) {
      amountText = `≥ ${formatCurrency(filters.amountRange.min / 100, currency)}`;
    } else if (filters.amountRange?.max !== undefined) {
      amountText = `≤ ${formatCurrency(filters.amountRange.max / 100, currency)}`;
    }

    if (amountText) {
      filterChips.push(
        <FilterChip
          key="amountRange"
          label="Amount"
          value={amountText}
          icon={<DollarSign className="h-3 w-3" />}
          onRemove={() => {
            onRemoveFilter('amountRange');
          }}
        />
      );
    }
  }

  // Payee Filter
  if (filters.payee && filters.payee.trim() !== '') {
    filterChips.push(
      <FilterChip
        key="payee"
        label="Payee"
        value={filters.payee}
        icon={<User className="h-3 w-3" />}
        onRemove={() => onRemoveFilter('payee')}
      />
    );
  }

  // Notes Filter
  if (filters.notes && filters.notes.trim() !== '') {
    filterChips.push(
      <FilterChip
        key="notes"
        label="Notes"
        value={filters.notes}
        icon={<FileText className="h-3 w-3" />}
        onRemove={() => onRemoveFilter('notes')}
      />
    );
  }

  // Don't render anything if no filters are active
  if (filterChips.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-muted-foreground">
        Active Filters:
      </span>
      {filterChips}
      {filterChips.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Clear All
        </Button>
      )}
    </div>
  );
}; 