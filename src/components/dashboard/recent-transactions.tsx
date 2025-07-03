/**
 * @file recent-transactions.tsx
 * @description This file contains the recent transactions component for the dashboard.
 * It displays the latest transactions with proper formatting and quick action options.
 */

import React from 'react'
import { format } from 'date-fns'
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, Eye } from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

import { Transaction, getTransactionTypeLabel } from '@/types/transaction'
import { formatCurrency } from '@/lib/currency'

/**
 * Transaction icon component
 * @description Returns appropriate icon for transaction type
 * @param type - Transaction type
 * @returns React icon component
 */
function TransactionIcon({ type }: { type: Transaction['type'] }) {
  const iconProps = { className: "h-4 w-4" }
  
  switch (type) {
    case 'deposit':
      return <ArrowDownRight {...iconProps} className="h-4 w-4 text-green-600" />
    case 'withdrawal':
      return <ArrowUpRight {...iconProps} className="h-4 w-4 text-red-600" />
    case 'transfer':
      return <ArrowLeftRight {...iconProps} className="h-4 w-4 text-blue-600" />
    default:
      return <ArrowUpRight {...iconProps} />
  }
}

/**
 * Transaction status badge component
 * @description Returns styled badge for transaction status
 * @param status - Transaction status
 * @returns React badge component
 */
function TransactionStatusBadge({ status }: { status: Transaction['status'] }) {
  const getStatusConfig = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return { variant: 'default' as const, label: 'Completed' }
      case 'pending':
        return { variant: 'secondary' as const, label: 'Pending' }
      case 'cancelled':
        return { variant: 'destructive' as const, label: 'Cancelled' }
      default:
        return { variant: 'outline' as const, label: status }
    }
  }

  const config = getStatusConfig(status)
  
  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  )
}

/**
 * Transaction description component
 * @description Returns formatted transaction description
 * @param transaction - Transaction object
 * @returns Formatted description string
 */
function getTransactionDescription(transaction: Transaction): string {
  if (transaction.type === 'transfer') {
    const from = transaction.fromAccount?.name || 'Unknown Account'
    const to = transaction.toAccount?.name || 'Unknown Account'
    return `Transfer from ${from} to ${to}`
  }
  
  const payee = transaction.payee?.displayName || 'Unknown Payee'
  const account = transaction.account?.name || 'Unknown Account'
  const category = transaction.category?.displayName
  
  if (category) {
    return `${payee} • ${category} • ${account}`
  }
  
  return `${payee} • ${account}`
}

/**
 * Recent transactions props interface
 * @description Props for RecentTransactions component
 */
interface RecentTransactionsProps {
  transactions: Transaction[]
  isLoading?: boolean
  error?: string | null
}

/**
 * Recent transactions component
 * @description Displays list of recent transactions with details
 * @param transactions - Array of recent transactions
 * @param isLoading - Loading state indicator
 * @param error - Error message if any
 * @returns React component displaying recent transactions
 */
export function RecentTransactions({ 
  transactions, 
  isLoading = false, 
  error = null 
}: RecentTransactionsProps) {
  
  if (error) {
    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest transactions will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <p className="text-sm text-red-500">Failed to load transactions: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest transactions will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading transactions...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest transactions will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No transactions found.</p>
              <p className="text-xs mt-1">Add some transactions to see them here.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest {transactions.length} transactions</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/transactions">
            <Eye className="h-4 w-4 mr-2" />
            View All
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="max-h-[300px] overflow-y-auto">
          {transactions.map((transaction, index) => (
            <React.Fragment key={transaction.id}>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <TransactionIcon type={transaction.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getTransactionTypeLabel(transaction.type)}
                      </p>
                      <TransactionStatusBadge status={transaction.status} />
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {getTransactionDescription(transaction)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(transaction.date, 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    transaction.type === 'deposit' 
                      ? 'text-green-600' 
                      : transaction.type === 'withdrawal'
                      ? 'text-red-600'
                      : 'text-blue-600'
                  }`}>
                    {transaction.type === 'deposit' ? '+' : transaction.type === 'withdrawal' ? '-' : ''}
                    {formatCurrency(transaction.amount)}
                  </p>
                  {transaction.notes && (
                    <p className="text-xs text-gray-400 truncate max-w-24">
                      {transaction.notes}
                    </p>
                  )}
                </div>
              </div>
              {index < transactions.length - 1 && <Separator />}
            </React.Fragment>
          ))}
        </div>
        
        {transactions.length >= 10 && (
          <div className="pt-2">
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <Link href="/transactions">
                View All Transactions
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 