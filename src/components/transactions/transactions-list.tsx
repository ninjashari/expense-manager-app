/**
 * @file transactions-list.tsx
 * @description This file contains the transactions list component for displaying and managing transactions.
 * It provides a table view with filtering, sorting, and action buttons for each transaction.
 */

"use client"

import { useState } from "react"
import { format } from "date-fns"
import { MoreHorizontal, Edit, Trash2, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, ChevronsUpDown, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Checkbox } from "@/components/ui/checkbox"
import { Pagination, usePagination } from "@/components/ui/pagination"
import { Calendar } from "@/components/ui/calendar"

import { Transaction, getTransactionTypeLabel, getTransactionStatusLabel, isTransferTransaction } from "@/types/transaction"
import { Account, getCurrencySymbol } from "@/types/account"
import { Category } from "@/types/category"

/**
 * Props interface for TransactionsList component
 * @description Defines the props required for the transactions list
 */
interface TransactionsListProps {
  /**
   * Array of transactions to display
   */
  transactions: Transaction[]
  /**
   * Array of accounts available for filtering
   */
  accounts: Account[]
  /**
   * Array of categories available for filtering
   */
  categories: Category[]
  /**
   * Loading state for the transactions list
   */
  isLoading?: boolean
  /**
   * Callback function called when edit button is clicked
   * @param transaction - Transaction to edit
   */
  onEdit?: (transaction: Transaction) => void
  /**
   * Callback function called when delete button is clicked
   * @param transaction - Transaction to delete
   */
  onDelete?: (transaction: Transaction) => void
  /**
   * Callback function called when refresh is needed
   */
  onRefresh?: () => void
}

/**
 * Filter options interface
 * @description Defines the available filter options
 */
interface FilterOptions {
  search: string
  type: 'all' | 'deposit' | 'withdrawal' | 'transfer'
  status: 'all' | 'pending' | 'completed' | 'cancelled'
  accountIds: string[] // Array of selected account IDs
  categoryIds: string[] // Array of selected category IDs
  dateRange: 'all' | 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'custom'
  startDate?: Date
  endDate?: Date
}

/**
 * TransactionsList component
 * @description Renders a list of transactions in a table format with filtering and actions
 * @param props - Component props
 * @returns JSX element containing the transactions list
 */
export function TransactionsList({
  transactions,
  accounts,
  categories,
  isLoading = false,
  onEdit,
  onDelete
}: TransactionsListProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    type: 'all',
    status: 'all',
    accountIds: [],
    categoryIds: [],
    dateRange: 'all'
  })

  const [accountsPopoverOpen, setAccountsPopoverOpen] = useState(false)
  const [categoriesPopoverOpen, setCategoriesPopoverOpen] = useState(false)

  /**
   * Filter transactions based on current filter options
   * @description Applies search and filter criteria to the transactions list
   * @returns Filtered array of transactions
   */
  const filteredTransactions = transactions.filter(transaction => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      const searchFields = [
        transaction.notes,
        transaction.account?.name,
        transaction.fromAccount?.name,
        transaction.toAccount?.name,
        transaction.payee?.displayName,
        transaction.category?.displayName,
        transaction.amount.toString()
      ].filter(Boolean).join(' ').toLowerCase()

      if (!searchFields.includes(searchTerm)) {
        return false
      }
    }

    // Type filter
    if (filters.type !== 'all' && transaction.type !== filters.type) {
      return false
    }

    // Status filter
    if (filters.status !== 'all' && transaction.status !== filters.status) {
      return false
    }

    // Account filter
    if (filters.accountIds.length > 0) {
      const transactionAccountIds = [
        transaction.accountId,
        transaction.fromAccountId,
        transaction.toAccountId
      ].filter(Boolean)

      const hasMatchingAccount = transactionAccountIds.some(accountId =>
        filters.accountIds.includes(accountId!)
      )

      if (!hasMatchingAccount) {
        return false
      }
    }

    // Category filter
    if (filters.categoryIds.length > 0) {
      if (!transaction.categoryId || !filters.categoryIds.includes(transaction.categoryId)) {
        return false
      }
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const transactionDate = new Date(transaction.date)
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      let startDate: Date
      let endDate: Date

      switch (filters.dateRange) {
        case 'today':
          startDate = today
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
          break
        case 'yesterday':
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          startDate = yesterday
          endDate = new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
          break
        case 'last_7_days':
          startDate = new Date(today)
          startDate.setDate(startDate.getDate() - 7)
          endDate = now
          break
        case 'last_30_days':
          startDate = new Date(today)
          startDate.setDate(startDate.getDate() - 30)
          endDate = now
          break
        case 'this_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          endDate = now
          break
        case 'last_month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
          break
        case 'custom':
          if (filters.startDate && filters.endDate) {
            startDate = filters.startDate
            endDate = filters.endDate
          } else {
            return true // If custom range is selected but dates aren't set, show all
          }
          break
        default:
          return true
      }

      if (transactionDate < startDate || transactionDate > endDate) {
        return false
      }
    }

    return true
  })

  // Pagination state management
  const {
    currentPage,
    pageSize,
    onPageChange,
    onPageSizeChange,
  } = usePagination(filteredTransactions.length, 20)

  // Get paginated transactions
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  /**
   * Get transaction type icon
   * @description Returns appropriate icon for transaction type
   * @param type - Transaction type
   * @returns JSX icon element
   */
  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />
      case 'transfer':
        return <ArrowLeftRight className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  /**
   * Get status badge variant
   * @description Returns appropriate badge variant for transaction status
   * @param status - Transaction status
   * @returns Badge variant string
   */
  const getStatusVariant = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  /**
   * Format amount with proper styling
   * @description Formats transaction amount with currency and color coding
   * @param transaction - Transaction object
   * @returns Formatted amount string with styling classes
   */
  const formatAmount = (transaction: Transaction) => {
    const currency = transaction.account?.currency || transaction.fromAccount?.currency || 'INR'
    const symbol = getCurrencySymbol(currency)
    const amount = `${symbol}${transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

    let colorClass = ''
    if (transaction.type === 'deposit') {
      colorClass = 'text-green-600'
    } else if (transaction.type === 'withdrawal') {
      colorClass = 'text-red-600'
    } else {
      colorClass = 'text-blue-600'
    }

    return { amount, colorClass }
  }

  /**
   * Get account display for transaction
   * @description Returns appropriate account display based on transaction type
   * @param transaction - Transaction object
   * @returns Account display string
   */
  const getAccountDisplay = (transaction: Transaction) => {
    if (isTransferTransaction(transaction)) {
      return `${transaction.fromAccount?.name || 'Unknown'} → ${transaction.toAccount?.name || 'Unknown'}`
    }

    return transaction.account?.name || 'Unknown'
  }

  /**
   * Get payee display for transaction
   * @description Returns payee display name or appropriate fallback
   * @param transaction - Transaction object
   * @returns Payee display string
   */
  const getPayeeDisplay = (transaction: Transaction) => {
    if (isTransferTransaction(transaction)) {
      return '—' // No payee for transfers
    }

    return transaction.payee?.displayName || 'Unknown'
  }

  /**
   * Handle account filter selection
   * @description Updates the selected accounts filter
   * @param accountId - Account ID to toggle
   */
  const handleAccountToggle = (accountId: string) => {
    setFilters(prev => ({
      ...prev,
      accountIds: prev.accountIds.includes(accountId)
        ? prev.accountIds.filter(id => id !== accountId)
        : [...prev.accountIds, accountId]
    }))
  }

  /**
   * Clear all account filters
   * @description Removes all selected accounts from filter
   */
  const clearAccountFilters = () => {
    setFilters(prev => ({ ...prev, accountIds: [] }))
  }

  /**
   * Get selected accounts display text
   * @description Returns display text for selected accounts
   * @returns Display text string
   */
  const getSelectedAccountsText = () => {
    if (filters.accountIds.length === 0) {
      return 'All Accounts'
    }

    if (filters.accountIds.length === 1) {
      const account = accounts.find(acc => acc.id === filters.accountIds[0])
      return account?.name || 'Unknown Account'
    }

    return `${filters.accountIds.length} accounts selected`
  }

  /**
   * Handle category selection toggle
   * @description Toggles a category in the filter selection
   * @param categoryId - Category ID to toggle
   */
  const handleCategoryToggle = (categoryId: string) => {
    setFilters(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }))
  }

  /**
   * Clear all category filters
   * @description Resets category filter to show all categories
   */
  const clearCategoryFilters = () => {
    setFilters(prev => ({ ...prev, categoryIds: [] }))
  }

  /**
   * Get selected categories display text
   * @description Returns formatted text for selected categories
   * @returns Display text for category filter
   */
  const getSelectedCategoriesText = () => {
    if (filters.categoryIds.length === 0) {
      return 'All Categories'
    }

    if (filters.categoryIds.length === 1) {
      const category = categories.find(cat => cat.id === filters.categoryIds[0])
      return category?.displayName || 'Unknown Category'
    }

    return `${filters.categoryIds.length} categories selected`
  }

  /**
   * Reset all filters to default state
   * @description Clears all active filters and resets to initial state
   */
  const resetAllFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      status: 'all',
      accountIds: [],
      categoryIds: [],
      dateRange: 'all'
    })
  }

  /**
   * Check if any filters are active
   * @description Determines if any filters are currently applied
   * @returns True if filters are active, false otherwise
   */
  const hasActiveFilters = () => {
    return (
      filters.search !== '' ||
      filters.type !== 'all' ||
      filters.status !== 'all' ||
      filters.accountIds.length > 0 ||
      filters.categoryIds.length > 0 ||
      filters.dateRange !== 'all'
    )
  }



  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Loading transactions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
        <CardDescription>
          Manage your income, expenses, and transfers. 
          {filteredTransactions.length !== transactions.length ? (
            <>Showing {filteredTransactions.length} of {transactions.length} transactions</>
          ) : (
            <>Total: {filteredTransactions.length} transactions</>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6">
          {/* First row of filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full min-w-0"
            />

            <Select
              value={filters.type}
              onValueChange={(value) => setFilters(prev => ({ ...prev, type: value as FilterOptions['type'] }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="withdrawal">Withdrawals</SelectItem>
                <SelectItem value="transfer">Transfers</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as FilterOptions['status'] }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Select
              value={filters.dateRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value as FilterOptions['dateRange'] }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Second row of filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Accounts Multi-Select Filter */}
            <Popover open={accountsPopoverOpen} onOpenChange={setAccountsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={accountsPopoverOpen}
                  className="justify-between w-full min-w-0"
                >
                  <span className="truncate flex-1 text-left">{getSelectedAccountsText()}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search accounts..." />
                  <CommandList>
                    <CommandEmpty>No accounts found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={clearAccountFilters}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={filters.accountIds.length === 0}
                            onChange={() => { }}
                          />
                          <span>All Accounts</span>
                        </div>
                      </CommandItem>
                      {accounts.map((account) => (
                        <CommandItem
                          key={account.id}
                          onSelect={() => handleAccountToggle(account.id)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={filters.accountIds.includes(account.id)}
                              onChange={() => { }}
                            />
                            <span>{account.name}</span>
                            <Badge variant="outline" className="ml-auto">
                              {account.type}
                            </Badge>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Categories Multi-Select Filter */}
            <Popover open={categoriesPopoverOpen} onOpenChange={setCategoriesPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={categoriesPopoverOpen}
                  className="justify-between w-full min-w-0"
                >
                  <span className="truncate flex-1 text-left">{getSelectedCategoriesText()}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search categories..." />
                  <CommandList>
                    <CommandEmpty>No categories found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={clearCategoryFilters}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={filters.categoryIds.length === 0}
                            onChange={() => { }}
                          />
                          <span>All Categories</span>
                        </div>
                      </CommandItem>
                      {categories.map((category) => (
                        <CommandItem
                          key={category.id}
                          onSelect={() => handleCategoryToggle(category.id)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={filters.categoryIds.includes(category.id)}
                              onChange={() => { }}
                            />
                            <span>{category.displayName}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Custom Date Range Picker - Only show when 'custom' is selected */}
            {filters.dateRange === 'custom' && (
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {filters.startDate ? format(filters.startDate, 'MMM dd, yyyy') : 'Start Date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.startDate}
                      onSelect={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {filters.endDate ? format(filters.endDate, 'MMM dd, yyyy') : 'End Date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.endDate}
                      onSelect={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Reset Filters Button - Always visible but only enabled when filters are active */}
            {!filters.dateRange || filters.dateRange !== 'custom' ? (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetAllFilters}
                  disabled={!hasActiveFilters()}
                  className="w-auto"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Filters
                </Button>
              </div>
            ) : null}
          </div>

          {/* Reset button for custom date range layout */}
          {filters.dateRange === 'custom' && (
            <div className="flex justify-end mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllFilters}
                disabled={!hasActiveFilters()}
                className="w-auto"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          )}
        </div>

        {/* Transactions Table */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg font-medium">No transactions found</p>
            <p className="text-muted-foreground">
              {transactions.length === 0
                ? "Add your first transaction to get started"
                : "Try adjusting your filters"
              }
            </p>
          </div>
        ) : (
          <>
            <div className="w-full">
              <div className="rounded-md border overflow-x-auto">
                <Table className="w-full table-auto">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Date</TableHead>
                      <TableHead className="whitespace-nowrap">Type</TableHead>
                      <TableHead className="whitespace-nowrap">Payee</TableHead>
                      <TableHead className="whitespace-nowrap">Account</TableHead>
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">Category</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Amount</TableHead>
                      <TableHead className="whitespace-nowrap hidden md:table-cell">Status</TableHead>
                      <TableHead className="whitespace-nowrap w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransactions.map((transaction) => {
                      const { amount, colorClass } = formatAmount(transaction)

                      return (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium text-sm whitespace-nowrap">
                            <div className="flex flex-col">
                              <span>{format(transaction.date, 'MMM dd')}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(transaction.date, 'yyyy')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(transaction.type)}
                              <span className="text-sm">
                                {getTransactionTypeLabel(transaction.type)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-0">
                            <div className="flex flex-col">
                              <div className="font-medium text-sm truncate max-w-[200px]">
                                {getPayeeDisplay(transaction)}
                              </div>
                              {transaction.category && (
                                <div className="text-xs text-muted-foreground sm:hidden truncate max-w-[200px]">
                                  {transaction.category.displayName}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-0">
                            <div className="flex flex-col">
                              <div className="font-medium text-sm truncate max-w-[200px]">
                                {getAccountDisplay(transaction)}
                              </div>
                              {transaction.notes && (
                                <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                                  {transaction.notes}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground md:hidden mt-1">
                                <Badge variant={getStatusVariant(transaction.status)} className="text-xs">
                                  {getTransactionStatusLabel(transaction.status)}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell whitespace-nowrap">
                            {transaction.category ? (
                              <Badge variant="outline" className="text-xs">
                                {transaction.category.displayName}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className={`font-medium text-right whitespace-nowrap ${colorClass}`}>
                            <span className="text-sm">{amount}</span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell whitespace-nowrap">
                            <Badge variant={getStatusVariant(transaction.status)} className="text-xs">
                              {getTransactionStatusLabel(transaction.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="w-12">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {onEdit && (
                                  <DropdownMenuItem onClick={() => onEdit(transaction)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                {onDelete && (
                                  <DropdownMenuItem
                                    onClick={() => onDelete(transaction)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            {/* Pagination */}
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredTransactions.length}
                pageSize={pageSize}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
                pageSizeOptions={[10, 20, 50, 100]}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
} 