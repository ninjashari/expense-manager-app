/**
 * @file transactions-list.tsx
 * @description This file contains the transactions list component for displaying and managing transactions.
 * It provides a table view with filtering, sorting, and action buttons for each transaction.
 */

"use client"

import { useState } from "react"
import { format } from "date-fns"
import { MoreHorizontal, Edit, Trash2, ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

import { Transaction, getTransactionTypeLabel, getTransactionStatusLabel, isTransferTransaction } from "@/types/transaction"
import { getCurrencySymbol } from "@/types/account"

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
}

/**
 * TransactionsList component
 * @description Renders a list of transactions in a table format with filtering and actions
 * @param props - Component props
 * @returns JSX element containing the transactions list
 */
export function TransactionsList({
  transactions,
  isLoading = false,
  onEdit,
  onDelete
}: TransactionsListProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    type: 'all',
    status: 'all'
  })

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

    return true
  })

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
   * Get transaction description
   * @description Returns appropriate description based on transaction type
   * @param transaction - Transaction object
   * @returns Description string
   */
  const getTransactionDescription = (transaction: Transaction) => {
    if (isTransferTransaction(transaction)) {
      return `${transaction.fromAccount?.name || 'Unknown'} → ${transaction.toAccount?.name || 'Unknown'}`
    }
    
    const parts = []
    if (transaction.payee?.displayName) {
      parts.push(transaction.payee.displayName)
    }
    if (transaction.account?.name) {
      parts.push(`(${transaction.account.name})`)
    }
    
    return parts.join(' ') || 'Unknown'
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
          Manage your income, expenses, and transfers. Total: {filteredTransactions.length} transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Input
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
          
          <Select
            value={filters.type}
            onValueChange={(value) => setFilters(prev => ({ ...prev, type: value as FilterOptions['type'] }))}
          >
            <SelectTrigger>
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
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  const { amount, colorClass } = formatAmount(transaction)
                  
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {format(transaction.date, 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(transaction.type)}
                          {getTransactionTypeLabel(transaction.type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{getTransactionDescription(transaction)}</div>
                          {transaction.notes && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {transaction.notes}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.category ? (
                          <Badge variant="outline">{transaction.category.displayName}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className={`font-medium ${colorClass}`}>
                        {amount}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(transaction.status)}>
                          {getTransactionStatusLabel(transaction.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
        )}
      </CardContent>
    </Card>
  )
} 