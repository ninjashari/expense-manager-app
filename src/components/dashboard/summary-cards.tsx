/**
 * @file summary-cards.tsx
 * @description This file contains the summary cards component for the dashboard.
 * It displays key financial metrics with performance indicators and trend analysis.
 */

import React from 'react'
import { TrendingUp, TrendingDown, Wallet, DollarSign } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { formatCurrency } from '@/lib/currency'

/**
 * Trend indicator component
 * @description Shows percentage change with appropriate icon and color
 * @param change - Percentage change value
 * @param label - Label for the trend
 * @returns React component showing trend
 */
function TrendIndicator({ change, label }: { change: number; label: string }) {
  const isPositive = change >= 0
  const isNeutral = change === 0
  
  if (isNeutral) {
    return (
      <p className="text-xs text-muted-foreground">
        {label} unchanged
      </p>
    )
  }
  
  return (
    <div className="flex items-center space-x-1">
      {isPositive ? (
        <TrendingUp className="h-3 w-3 text-green-600" />
      ) : (
        <TrendingDown className="h-3 w-3 text-red-600" />
      )}
      <p className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '+' : ''}{change.toFixed(1)}% {label}
      </p>
    </div>
  )
}

/**
 * Summary card component
 * @description Individual summary card with metric and trend
 */
interface SummaryCardProps {
  title: string
  value: number
  icon: React.ReactNode
  trend?: {
    change: number
    label: string
  }
  description?: string
  variant?: 'default' | 'income' | 'expense' | 'balance'
}

function SummaryCard({ 
  title, 
  value, 
  icon, 
  trend, 
  description,
  variant = 'default'
}: SummaryCardProps) {
  const getValueColor = () => {
    switch (variant) {
      case 'income':
        return 'text-green-600'
      case 'expense':
        return 'text-red-600'
      case 'balance':
        return value >= 0 ? 'text-green-600' : 'text-red-600'
      default:
        return 'text-foreground'
    }
  }

  const getIconColor = () => {
    switch (variant) {
      case 'income':
        return 'text-green-600'
      case 'expense':
        return 'text-red-600'
      case 'balance':
        return 'text-blue-600'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={getIconColor()}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${getValueColor()}`}>
          {formatCurrency(value)}
        </div>
        <div className="mt-1 space-y-1">
          {trend && (
            <TrendIndicator change={trend.change} label={trend.label} />
          )}
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Dashboard summary cards props interface
 * @description Props for DashboardSummaryCards component
 */
interface DashboardSummaryCardsProps {
  totalBalance: number
  totalIncome: number
  totalExpenses: number
  netIncome: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyNet: number
  incomeChange: number
  expenseChange: number
  isLoading?: boolean
  error?: string | null
}

/**
 * Dashboard summary cards component
 * @description Displays key financial metrics in card format
 * @param props - Dashboard metrics and state
 * @returns React component with summary cards
 */
export function DashboardSummaryCards({
  totalBalance,
  totalIncome,
  totalExpenses,
  monthlyIncome,
  monthlyExpenses,
  monthlyNet,
  incomeChange,
  expenseChange,
  isLoading = false,
  error = null
}: DashboardSummaryCardsProps) {
  
  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-red-500">
                Failed to load
              </div>
              <p className="text-xs text-muted-foreground">
                {error}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-8 bg-muted animate-pulse rounded"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const netChange = incomeChange - expenseChange

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Total Balance"
        value={totalBalance}
        icon={<Wallet className="h-4 w-4" />}
        description="Across all active accounts"
        variant="balance"
      />
      
      <SummaryCard
        title="This Month"
        value={monthlyNet}
        icon={<DollarSign className="h-4 w-4" />}
        trend={{
          change: netChange,
          label: "vs last month"
        }}
        description={`₹${monthlyIncome.toLocaleString('en-IN')} in - ₹${monthlyExpenses.toLocaleString('en-IN')} out`}
        variant="balance"
      />
      
      <SummaryCard
        title="Total Income"
        value={totalIncome}
        icon={<TrendingUp className="h-4 w-4" />}
        description="All-time earnings"
        variant="income"
      />
      
      <SummaryCard
        title="Total Expenses"
        value={totalExpenses}
        icon={<TrendingDown className="h-4 w-4" />}
        description="All-time spending"
        variant="expense"
      />
    </div>
  )
} 