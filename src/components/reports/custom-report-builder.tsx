/**
 * @file custom-report-builder.tsx
 * @description Simplified custom report builder for filtering transactions and exporting data.
 * It provides transaction filtering, tabular display, and CSV export functionality.
 */

"use client"

import React, { useState, useCallback, useEffect } from 'react'
import { Download, Settings, Filter, FileText, Group } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

import { Account } from '@/types/account'
import { Category } from '@/types/category'
import { Payee } from '@/types/payee'
import { Transaction } from '@/types/transaction'
import {
  ReportFilters,
  DEFAULT_REPORT_FILTERS
} from '@/types/report'

import { ReportFilters as ReportFiltersComponent } from './report-filters'
import { filterTransactions } from '@/lib/services/report-service'
import { getTransactions } from '@/lib/services/supabase-transaction-service'

/**
 * Props interface for the CustomReportBuilder component
 * @description Defines the props required for the simplified report builder
 */
interface CustomReportBuilderProps {
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
   * User ID for data fetching
   */
  userId: string
}

/**
 * Format currency for display
 * @description Formats amounts in Indian Rupees
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Group by options for transactions
 */
type GroupByOption = 'none' | 'account' | 'category' | 'payee' | 'type' | 'status' | 'date'

const GROUP_BY_OPTIONS = [
  { value: 'none', label: 'No Grouping' },
  { value: 'account', label: 'Group by Account' },
  { value: 'category', label: 'Group by Category' },
  { value: 'payee', label: 'Group by Payee' },
  { value: 'type', label: 'Group by Type' },
  { value: 'status', label: 'Group by Status' },
  { value: 'date', label: 'Group by Date (Month)' },
] as const

/**
 * Grouped transaction data structure
 */
interface GroupedData {
  groupKey: string
  groupLabel: string
  transactions: Transaction[]
  totalAmount: number
  count: number
}

/**
 * Group transactions by specified field
 * @description Groups transactions and calculates totals
 * @param transactions - Array of transactions to group
 * @param groupBy - Field to group by
 * @returns Array of grouped data
 */
function groupTransactions(transactions: Transaction[], groupBy: GroupByOption): GroupedData[] {
  if (groupBy === 'none') {
    return [{
      groupKey: 'all',
      groupLabel: 'All Transactions',
      transactions,
      totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
      count: transactions.length
    }]
  }

  const groups = new Map<string, Transaction[]>()

  transactions.forEach(transaction => {
    let groupKey = ''

    switch (groupBy) {
      case 'account':
        if (transaction.type === 'transfer') {
          groupKey = `${transaction.fromAccountId}-${transaction.toAccountId}`
        } else {
          groupKey = transaction.accountId || 'unknown'
        }
        break
      case 'category':
        groupKey = transaction.categoryId || 'uncategorized'
        break
      case 'payee':
        groupKey = transaction.payeeId || 'unknown'
        break
      case 'type':
        groupKey = transaction.type
        break
      case 'status':
        groupKey = transaction.status
        break
      case 'date':
        const date = new Date(transaction.date)
        groupKey = format(date, 'yyyy-MM')
        break
      default:
        groupKey = 'other'
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, [])
    }
    groups.get(groupKey)!.push(transaction)
  })

  return Array.from(groups.entries()).map(([groupKey, groupTransactions]) => {
    const groupLabel = groupTransactions[0] ? getGroupLabel(groupTransactions[0], groupBy) : groupKey
    return {
      groupKey,
      groupLabel,
      transactions: groupTransactions,
      totalAmount: groupTransactions.reduce((sum, t) => sum + t.amount, 0),
      count: groupTransactions.length
    }
  }).sort((a, b) => b.totalAmount - a.totalAmount)
}

/**
 * Get group label for a transaction
 * @description Gets the display label for grouping
 * @param transaction - Transaction to get label from
 * @param groupBy - Grouping field
 * @returns Display label
 */
function getGroupLabel(transaction: Transaction, groupBy: GroupByOption): string {
  switch (groupBy) {
    case 'account':
      if (transaction.type === 'transfer') {
        return `${transaction.fromAccount?.name} → ${transaction.toAccount?.name}`
      }
      return transaction.account?.name || 'Unknown Account'
    case 'category':
      return transaction.category?.displayName || 'Uncategorized'
    case 'payee':
      return transaction.payee?.displayName || 'Unknown Payee'
    case 'type':
      return transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)
    case 'status':
      return transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)
    case 'date':
      return format(new Date(transaction.date), 'MMM yyyy')
    default:
      return 'Other'
  }
}

/**
 * Export transactions to CSV
 * @description Converts transaction data to CSV format and downloads it
 * @param transactions - Array of transactions to export
 * @param reportName - Name for the exported file
 * @param groupBy - Grouping option for additional context
 */
function exportToCSV(transactions: Transaction[], reportName: string = 'transactions', groupBy: GroupByOption = 'none') {
  if (transactions.length === 0) {
    toast.error('No transactions to export')
    return
  }

  // Create CSV headers (add group column if grouped)
  const headers = groupBy !== 'none' 
    ? [
        'Group',
        'Date',
        'Type',
        'Amount',
        'Account',
        'Category',
        'Payee',
        'From Account',
        'To Account',
        'Status',
        'Notes'
      ]
    : [
        'Date',
        'Type',
        'Amount',
        'Account',
        'Category',
        'Payee',
        'From Account',
        'To Account',
        'Status',
        'Notes'
      ]

  // Convert transactions to CSV rows (add group column if grouped)
  const csvRows = transactions.map(transaction => {
    const baseRow = [
      format(new Date(transaction.date), 'yyyy-MM-dd'),
      transaction.type,
      transaction.amount.toString(),
      transaction.account?.name || '',
      transaction.category?.displayName || '',
      transaction.payee?.displayName || '',
      transaction.fromAccount?.name || '',
      transaction.toAccount?.name || '',
      transaction.status,
      transaction.notes || ''
    ]
    
    if (groupBy !== 'none') {
      return [getGroupLabel(transaction, groupBy), ...baseRow]
    }
    
    return baseRow
  })

  // Combine headers and rows
  const csvContent = [headers, ...csvRows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${reportName}-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('CSV exported successfully!')
  }
}

/**
 * Simplified Custom Report Builder component
 * @description Component for filtering transactions and exporting data
 */
export function CustomReportBuilder({
  accounts,
  categories,
  payees,
  userId
}: CustomReportBuilderProps) {
  // State management
  const [reportName, setReportName] = useState('Custom Transaction Report')
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_REPORT_FILTERS)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [groupBy, setGroupBy] = useState<GroupByOption>('none')
  const [isLoading, setIsLoading] = useState(false)

  // Generate filtered transaction data
  const generateReport = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch all transactions for the user
      const allTransactions = await getTransactions(userId)
      
      // Apply filters
      const filtered = filterTransactions(allTransactions, filters)
      
      setTransactions(allTransactions)
      setFilteredTransactions(filtered)
      
      toast.success(`Found ${filtered.length} transactions matching your criteria`)
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Failed to load transactions. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [filters, userId])

  // Handle filter changes
  const handleFiltersChange = (newFilters: ReportFilters) => {
    console.log('CustomReportBuilder: handleFiltersChange called with:', newFilters)
    console.log('CustomReportBuilder: Previous filters:', filters)
    setFilters(newFilters)
  }

  // Auto-regenerate report when filters change
  useEffect(() => {
    // Only regenerate if we have transactions data already (not on initial load)
    if (transactions.length > 0) {
      const filtered = filterTransactions(transactions, filters)
      setFilteredTransactions(filtered)
    }
  }, [filters, transactions])

  // Generate initial report on component mount
  useEffect(() => {
    generateReport()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Log when filters change
  useEffect(() => {
    console.log('CustomReportBuilder: filters state changed to:', filters)
  }, [filters])

  // Group transactions if needed
  const groupedData = groupTransactions(filteredTransactions, groupBy)

  // Calculate summary statistics
  const summary = {
    totalTransactions: filteredTransactions.length,
    totalIncome: filteredTransactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: filteredTransactions
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0),
    totalTransfers: filteredTransactions
      .filter(t => t.type === 'transfer')
      .reduce((sum, t) => sum + t.amount, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Custom Transaction Report
              </CardTitle>
              <CardDescription>
                Filter your transactions and export the data as CSV
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={generateReport}
                disabled={isLoading}
                variant="default"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Filter className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Report Name</Label>
              <Input
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Enter report name..."
              />
            </div>
            <div>
              <Label>Group By</Label>
              <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupByOption)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grouping option" />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_BY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Group className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <ReportFiltersComponent
        filters={filters}
        accounts={accounts}
        categories={categories}
        payees={payees}
        onFiltersChange={handleFiltersChange}
        showAdvanced={true}
      />

      {/* Results */}
      {filteredTransactions.length > 0 && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Report Summary</CardTitle>
                <Button
                  onClick={() => exportToCSV(filteredTransactions, reportName, groupBy)}
                  variant="outline"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{summary.totalTransactions}</div>
                  <div className="text-sm text-muted-foreground">Total Transactions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary.totalIncome)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Income</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(summary.totalExpenses)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Expenses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(summary.totalTransfers)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Transfers</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {groupBy === 'none' 
                  ? `Transaction Details (${filteredTransactions.length} records)`
                  : `Grouped Transaction Details (${groupedData.length} groups, ${filteredTransactions.length} records)`
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {groupBy === 'none' ? (
                  // Regular table view
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Payee</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.slice(0, 100).map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              {format(new Date(transaction.date), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  transaction.type === 'deposit' ? 'default' : 
                                  transaction.type === 'withdrawal' ? 'destructive' : 
                                  'secondary'
                                }
                              >
                                {transaction.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(transaction.amount)}
                            </TableCell>
                            <TableCell>
                              {transaction.type === 'transfer' ? (
                                <div className="text-sm">
                                  <div>{transaction.fromAccount?.name} →</div>
                                  <div>{transaction.toAccount?.name}</div>
                                </div>
                              ) : (
                                transaction.account?.name
                              )}
                            </TableCell>
                            <TableCell>
                              {transaction.category?.displayName || '-'}
                            </TableCell>
                            <TableCell>
                              {transaction.payee?.displayName || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  transaction.status === 'completed' ? 'default' : 
                                  transaction.status === 'pending' ? 'secondary' : 
                                  'destructive'
                                }
                              >
                                {transaction.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {transaction.notes || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {filteredTransactions.length > 100 && (
                      <div className="text-center text-sm text-muted-foreground py-4">
                        Showing first 100 transactions. Export CSV to get all {filteredTransactions.length} records.
                      </div>
                    )}
                  </>
                ) : (
                  // Grouped table view
                  <div className="space-y-6">
                    {groupedData.map((group) => (
                      <div key={group.groupKey} className="space-y-2">
                        {/* Group Header */}
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <Group className="h-4 w-4" />
                            <span className="font-medium">{group.groupLabel}</span>
                            <Badge variant="outline">{group.count} transactions</Badge>
                          </div>
                          <div className="font-medium">
                            {formatCurrency(group.totalAmount)}
                          </div>
                        </div>
                        
                        {/* Group Transactions */}
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Account</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Payee</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.transactions.slice(0, 20).map((transaction) => (
                              <TableRow key={transaction.id}>
                                <TableCell>
                                  {format(new Date(transaction.date), 'MMM dd, yyyy')}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      transaction.type === 'deposit' ? 'default' : 
                                      transaction.type === 'withdrawal' ? 'destructive' : 
                                      'secondary'
                                    }
                                  >
                                    {transaction.type}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {formatCurrency(transaction.amount)}
                                </TableCell>
                                <TableCell>
                                  {transaction.type === 'transfer' ? (
                                    <div className="text-sm">
                                      <div>{transaction.fromAccount?.name} →</div>
                                      <div>{transaction.toAccount?.name}</div>
                                    </div>
                                  ) : (
                                    transaction.account?.name
                                  )}
                                </TableCell>
                                <TableCell>
                                  {transaction.category?.displayName || '-'}
                                </TableCell>
                                <TableCell>
                                  {transaction.payee?.displayName || '-'}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      transaction.status === 'completed' ? 'default' : 
                                      transaction.status === 'pending' ? 'secondary' : 
                                      'destructive'
                                    }
                                  >
                                    {transaction.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {transaction.notes || '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {group.transactions.length > 20 && (
                          <div className="text-center text-sm text-muted-foreground py-2">
                            Showing first 20 transactions in this group. Export CSV to get all {group.transactions.length} records.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!isLoading && filteredTransactions.length === 0 && transactions.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Data Yet</h3>
              <p>Click &quot;Generate Report&quot; to load and filter your transactions.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {!isLoading && filteredTransactions.length === 0 && transactions.length > 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Matching Transactions</h3>
              <p>Try adjusting your filters to see more results.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 