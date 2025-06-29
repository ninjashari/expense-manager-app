/**
 * @file report-service.ts
 * @description This file contains the report generation service functions.
 * It provides data processing, filtering, and analytics for comprehensive financial reporting.
 */

import { format, startOfMonth, startOfQuarter, startOfYear } from 'date-fns'
import { Transaction } from '@/types/transaction'
import { Account } from '@/types/account'
import {
  ReportFilters,
  ReportData,
  TransactionSummary,
  CategoryBreakdown,
  TimeSeriesData,
  AccountPerformance,
  PayeeAnalysis,
  ReportConfig,
  TimeGrouping,
  getDateRangeFromPreset
} from '@/types/report'



/**
 * Filter transactions based on report filters
 * @description Applies comprehensive filtering to transaction list
 * @param transactions - All user transactions
 * @param filters - Filter configuration
 * @returns Filtered transaction array
 */
export function filterTransactions(transactions: Transaction[], filters: ReportFilters): Transaction[] {
  return transactions.filter(transaction => {
    // Date filtering
    const dateRange = getDateRangeFromPreset(filters.dateRange)
    const transactionDate = new Date(transaction.date)
    
    if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
      if (transactionDate < filters.startDate || transactionDate > filters.endDate) {
        return false
      }
    } else if (dateRange) {
      if (transactionDate < dateRange.start || transactionDate > dateRange.end) {
        return false
      }
    }

    // Account filtering
    if (filters.accountIds.length > 0) {
      const hasAccount = filters.accountIds.some(accountId => 
        transaction.accountId === accountId ||
        transaction.fromAccountId === accountId ||
        transaction.toAccountId === accountId
      )
      if (!hasAccount) return false
    }

    // Category filtering
    if (filters.categoryIds.length > 0 && transaction.categoryId) {
      if (!filters.categoryIds.includes(transaction.categoryId)) {
        return false
      }
    }

    // Payee filtering
    if (filters.payeeIds.length > 0 && transaction.payeeId) {
      if (!filters.payeeIds.includes(transaction.payeeId)) {
        return false
      }
    }

    // Transaction type filtering
    if (filters.transactionTypes.length > 0) {
      if (!filters.transactionTypes.includes(transaction.type)) {
        return false
      }
    }

    // Transaction status filtering
    if (filters.transactionStatuses.length > 0) {
      if (!filters.transactionStatuses.includes(transaction.status)) {
        return false
      }
    }

    // Amount filtering
    if (filters.minAmount !== undefined && transaction.amount < filters.minAmount) {
      return false
    }
    if (filters.maxAmount !== undefined && transaction.amount > filters.maxAmount) {
      return false
    }

    // Account type filtering
    if (filters.accountTypes.length > 0) {
      const accountType = transaction.account?.type || 
                         transaction.fromAccount?.type || 
                         transaction.toAccount?.type
      if (!accountType || !filters.accountTypes.includes(accountType)) {
        return false
      }
    }

    // Search term filtering
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase()
      const searchableText = [
        transaction.payee?.displayName,
        transaction.category?.displayName,
        transaction.account?.name,
        transaction.fromAccount?.name,
        transaction.toAccount?.name,
        filters.includeNotes ? transaction.notes : undefined
      ].filter(Boolean).join(' ').toLowerCase()

      if (!searchableText.includes(searchTerm)) {
        return false
      }
    }

    return true
  })
}

/**
 * Generate transaction summary
 * @description Creates summary statistics for filtered transactions
 * @param transactions - Filtered transactions
 * @param filters - Applied filters for date range context
 * @returns Transaction summary data
 */
export function generateTransactionSummary(transactions: Transaction[], filters: ReportFilters): TransactionSummary {
  let totalIncome = 0
  let totalExpenses = 0
  
  transactions.forEach(transaction => {
    if (transaction.type === 'deposit') {
      totalIncome += transaction.amount
    } else if (transaction.type === 'withdrawal') {
      totalExpenses += transaction.amount
    }
    // Transfers are neutral for income/expense calculation
  })

  const netIncome = totalIncome - totalExpenses
  const transactionCount = transactions.length
  const avgTransactionAmount = transactionCount > 0 ? (totalIncome + totalExpenses) / transactionCount : 0

  // Get date range for context
  const dateRange = getDateRangeFromPreset(filters.dateRange)
  let start = new Date()
  let end = new Date()

  if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
    start = filters.startDate
    end = filters.endDate
  } else if (dateRange) {
    start = dateRange.start
    end = dateRange.end
  }

  return {
    totalIncome,
    totalExpenses,
    netIncome,
    transactionCount,
    avgTransactionAmount,
    dateRange: {
      start,
      end
    }
  }
}

/**
 * Generate category breakdown
 * @description Creates spending breakdown by category
 * @param transactions - Filtered transactions
 * @returns Category breakdown data
 */
export function generateCategoryBreakdown(transactions: Transaction[]): CategoryBreakdown[] {
  const categoryMap = new Map<string, {
    categoryId: string
    categoryName: string
    amount: number
    transactionCount: number
    percentage: number
  }>()

  let totalAmount = 0

  // Process transactions to build category data
  transactions.forEach(transaction => {
    if (transaction.type === 'withdrawal' && transaction.category) {
      const categoryId = transaction.category.id
      const categoryName = transaction.category.displayName
      const amount = transaction.amount
      totalAmount += amount

      if (categoryMap.has(categoryId)) {
        const existing = categoryMap.get(categoryId)!
        existing.amount += amount
        existing.transactionCount += 1
      } else {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName,
          amount: amount,
          transactionCount: 1,
          percentage: 0
        })
      }
    }
  })

  // Calculate percentages and convert to array
  const breakdown: CategoryBreakdown[] = Array.from(categoryMap.values()).map(item => ({
    ...item,
    percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0,
    color: generateCategoryColor(item.categoryId)
  }))

  // Sort by total amount (descending)
  return breakdown.sort((a, b) => b.amount - a.amount)
}

/**
 * Generate time series data
 * @description Creates time-based data for charts
 * @param transactions - Filtered transactions
 * @param grouping - Time grouping (daily, weekly, monthly, yearly)
 * @returns Time series data array
 */
export function generateTimeSeriesData(transactions: Transaction[], grouping: TimeGrouping): TimeSeriesData[] {
  const timeMap = new Map<string, TimeSeriesData>()

  transactions.forEach(transaction => {
    const timePeriod = getTimePeriod(new Date(transaction.date), grouping)
    const key = timePeriod.key

    if (!timeMap.has(key)) {
      timeMap.set(key, {
        period: timePeriod.label,
        date: timePeriod.date,
        income: 0,
        expenses: 0,
        net: 0,
        transactionCount: 0
      })
    }

    const data = timeMap.get(key)!
    data.transactionCount += 1

    if (transaction.type === 'deposit') {
      data.income += transaction.amount
    } else if (transaction.type === 'withdrawal') {
      data.expenses += transaction.amount
    }
    // Transfers don't affect income/expenses

    data.net = data.income - data.expenses
  })

  // Convert to array and sort by date
  return Array.from(timeMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime())
}

/**
 * Generate account performance data
 * @description Creates performance metrics for each account
 * @param transactions - Filtered transactions
 * @param accounts - All user accounts
 * @param filters - Applied filters for context
 * @returns Account performance data
 */
export function generateAccountPerformance(
  transactions: Transaction[], 
  accounts: Account[], 
  filters: ReportFilters
): AccountPerformance[] {
  const accountMap = new Map<string, AccountPerformance>()

  // Initialize with all accounts
  accounts.forEach(account => {
    accountMap.set(account.id, {
      accountId: account.id,
      accountName: account.name,
      accountType: account.type,
      startingBalance: account.initialBalance,
      endingBalance: account.currentBalance,
      totalIncome: 0,
      totalExpenses: 0,
      netChange: 0,
      transactionCount: 0
    })
  })

  // Process transactions
  transactions.forEach(transaction => {
    const updateAccount = (accountId: string, isIncome: boolean, amount: number) => {
      const performance = accountMap.get(accountId)
      if (performance) {
        performance.transactionCount += 1
        if (isIncome) {
          performance.totalIncome += amount
        } else {
          performance.totalExpenses += amount
        }
        performance.netChange = performance.totalIncome - performance.totalExpenses
      }
    }

    if (transaction.type === 'deposit' && transaction.accountId) {
      updateAccount(transaction.accountId, true, transaction.amount)
    } else if (transaction.type === 'withdrawal' && transaction.accountId) {
      updateAccount(transaction.accountId, false, transaction.amount)
    } else if (transaction.type === 'transfer') {
      if (transaction.fromAccountId) {
        updateAccount(transaction.fromAccountId, false, transaction.amount)
      }
      if (transaction.toAccountId) {
        updateAccount(transaction.toAccountId, true, transaction.amount)
      }
    }
  })

  return Array.from(accountMap.values()).sort((a, b) => b.netChange - a.netChange)
}

/**
 * Generate payee analysis
 * @description Creates spending analysis by payee
 * @param transactions - Filtered transactions
 * @returns Payee analysis data
 */
export function generatePayeeAnalysis(transactions: Transaction[]): PayeeAnalysis[] {
  const payeeMap = new Map<string, PayeeAnalysis>()

  transactions.forEach(transaction => {
    if (transaction.payee && transaction.type === 'withdrawal') {
      const payeeId = transaction.payee.id
      const payeeName = transaction.payee.displayName
      
      if (payeeMap.has(payeeId)) {
        const existing = payeeMap.get(payeeId)!
        existing.totalAmount += transaction.amount
        existing.transactionCount += 1
        existing.avgTransactionAmount = existing.totalAmount / existing.transactionCount
        
        if (transaction.date > existing.lastTransactionDate) {
          existing.lastTransactionDate = transaction.date
        }
      } else {
        payeeMap.set(payeeId, {
          payeeId,
          payeeName,
          totalAmount: transaction.amount,
          transactionCount: 1,
          avgTransactionAmount: transaction.amount,
          lastTransactionDate: transaction.date,
          categories: transaction.category ? [transaction.category.displayName] : []
        })
      }

      // Update categories
      if (transaction.category) {
        const analysis = payeeMap.get(payeeId)!
        if (!analysis.categories.includes(transaction.category.displayName)) {
          analysis.categories.push(transaction.category.displayName)
        }
      }
    }
  })

  return Array.from(payeeMap.values()).sort((a, b) => b.totalAmount - a.totalAmount)
}

/**
 * Get time period for grouping
 * @description Determines time period key and label for a given date and grouping
 * @param date - Transaction date
 * @param grouping - Time grouping type
 * @returns Time period information
 */
function getTimePeriod(date: Date, grouping: TimeGrouping): { key: string; label: string; date: Date } {
  switch (grouping) {
    case 'daily':
      return {
        key: format(date, 'yyyy-MM-dd'),
        label: format(date, 'MMM dd'),
        date: new Date(date.getFullYear(), date.getMonth(), date.getDate())
      }
    case 'weekly':
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      return {
        key: format(weekStart, 'yyyy-\'W\'ww'),
        label: format(weekStart, 'MMM dd'),
        date: weekStart
      }
    case 'monthly':
      const monthStart = startOfMonth(date)
      return {
        key: format(monthStart, 'yyyy-MM'),
        label: format(monthStart, 'MMM yyyy'),
        date: monthStart
      }
    case 'quarterly':
      const quarterStart = startOfQuarter(date)
      return {
        key: format(quarterStart, 'yyyy-\'Q\'Q'),
        label: `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`,
        date: quarterStart
      }
    case 'yearly':
      const yearStart = startOfYear(date)
      return {
        key: format(yearStart, 'yyyy'),
        label: format(yearStart, 'yyyy'),
        date: yearStart
      }
    default:
      throw new Error(`Unsupported grouping: ${grouping}`)
  }
}

/**
 * Generate consistent color for category
 * @description Creates a consistent color based on category ID
 * @param categoryId - Category identifier
 * @returns Hex color string
 */
function generateCategoryColor(categoryId: string): string {
  // Simple hash function to generate consistent colors
  let hash = 0
  for (let i = 0; i < categoryId.length; i++) {
    hash = categoryId.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // Convert to HSL for better color distribution
  const hue = Math.abs(hash) % 360
  const saturation = 70 + (Math.abs(hash) % 20) // 70-90%
  const lightness = 45 + (Math.abs(hash) % 15) // 45-60%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

 