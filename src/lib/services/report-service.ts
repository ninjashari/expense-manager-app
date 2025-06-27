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
import { getTransactions } from './supabase-transaction-service'
import { getAccounts } from './supabase-account-service'

/**
 * Generate comprehensive report data
 * @description Creates complete report data based on configuration and filters
 * @param config - Report configuration
 * @param userId - User ID for data filtering
 * @returns Promise resolving to complete report data
 */
export async function generateReportData(config: ReportConfig, userId: string): Promise<ReportData> {
  // Fetch all necessary data
  const [transactions, accounts] = await Promise.all([
    getTransactions(userId),
    getAccounts(userId)
  ])

  // Apply filters to transactions
  const filteredTransactions = filterTransactions(transactions, config.filters)

  // Generate all report components
  const summary = generateTransactionSummary(filteredTransactions, config.filters)
  const categoryBreakdown = generateCategoryBreakdown(filteredTransactions)
  const timeSeriesData = generateTimeSeriesData(filteredTransactions, config.timeGrouping || 'monthly')
  const accountPerformance = generateAccountPerformance(filteredTransactions, accounts, config.filters)
  const payeeAnalysis = generatePayeeAnalysis(filteredTransactions)

  return {
    config,
    summary,
    categoryBreakdown,
    timeSeriesData,
    accountPerformance,
    payeeAnalysis,
    rawTransactions: filteredTransactions
  }
}

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
    dateRange: { start, end }
  }
}

/**
 * Generate category breakdown
 * @description Creates expense breakdown by category
 * @param transactions - Filtered transactions
 * @param categories - All categories for mapping
 * @returns Category breakdown data
 */
export function generateCategoryBreakdown(transactions: Transaction[]): CategoryBreakdown[] {
  const categoryMap = new Map<string, CategoryBreakdown>()
  let totalExpenses = 0

  // Calculate totals by category
  transactions.forEach(transaction => {
    if (transaction.type === 'withdrawal' && transaction.categoryId && transaction.category) {
      totalExpenses += transaction.amount
      
      const categoryId = transaction.categoryId
      const existingCategory = categoryMap.get(categoryId)
      
      if (existingCategory) {
        existingCategory.amount += transaction.amount
        existingCategory.transactionCount += 1
      } else {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName: transaction.category.displayName,
          amount: transaction.amount,
          percentage: 0, // Will be calculated below
          transactionCount: 1,
          color: generateCategoryColor(categoryId)
        })
      }
    }
  })

  // Calculate percentages and convert to array
  const breakdown = Array.from(categoryMap.values()).map(category => ({
    ...category,
    percentage: totalExpenses > 0 ? (category.amount / totalExpenses) * 100 : 0
  }))

  // Sort by amount descending
  return breakdown.sort((a, b) => b.amount - a.amount)
}

/**
 * Generate time series data
 * @description Creates time-based data for trend analysis
 * @param transactions - Filtered transactions
 * @param grouping - How to group data by time
 * @returns Time series data array
 */
export function generateTimeSeriesData(transactions: Transaction[], grouping: TimeGrouping): TimeSeriesData[] {
  const groupedData = new Map<string, TimeSeriesData>()

  transactions.forEach(transaction => {
    const period = getTimePeriod(transaction.date, grouping)
    const existing = groupedData.get(period.key)

    if (existing) {
      if (transaction.type === 'deposit') {
        existing.income += transaction.amount
      } else if (transaction.type === 'withdrawal') {
        existing.expenses += transaction.amount
      }
      existing.transactionCount += 1
      existing.net = existing.income - existing.expenses
    } else {
      const income = transaction.type === 'deposit' ? transaction.amount : 0
      const expenses = transaction.type === 'withdrawal' ? transaction.amount : 0
      
      groupedData.set(period.key, {
        period: period.label,
        date: period.date,
        income,
        expenses,
        net: income - expenses,
        transactionCount: 1
      })
    }
  })

  return Array.from(groupedData.values()).sort((a, b) => a.date.getTime() - b.date.getTime())
}

/**
 * Generate account performance data
 * @description Creates performance metrics for each account
 * @param transactions - Filtered transactions
 * @param accounts - All accounts for mapping
 * @param filters - Applied filters for context
 * @returns Account performance data
 */
export function generateAccountPerformance(
  transactions: Transaction[], 
  accounts: Account[], 
  filters: ReportFilters
): AccountPerformance[] {
  const accountMap = new Map<string, AccountPerformance>()

  // Initialize with all relevant accounts
  accounts.forEach(account => {
    if (filters.accountIds.length === 0 || filters.accountIds.includes(account.id)) {
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
    }
  })

  // Process transactions
  transactions.forEach(transaction => {
    const updateAccount = (accountId: string, isIncome: boolean, amount: number) => {
      const performance = accountMap.get(accountId)
      if (performance) {
        if (isIncome) {
          performance.totalIncome += amount
        } else {
          performance.totalExpenses += amount
        }
        performance.transactionCount += 1
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
 * Generate payee analysis data
 * @description Creates analysis of transactions by payee
 * @param transactions - Filtered transactions
 * @param payees - All payees for mapping
 * @returns Payee analysis data
 */
export function generatePayeeAnalysis(transactions: Transaction[]): PayeeAnalysis[] {
  const payeeMap = new Map<string, PayeeAnalysis>()

  transactions.forEach(transaction => {
    if (transaction.payeeId && transaction.payee) {
      const payeeId = transaction.payeeId
      const existing = payeeMap.get(payeeId)

      if (existing) {
        existing.totalAmount += transaction.amount
        existing.transactionCount += 1
        existing.avgTransactionAmount = existing.totalAmount / existing.transactionCount
        
        if (transaction.date > existing.lastTransactionDate) {
          existing.lastTransactionDate = transaction.date
        }

        if (transaction.category && !existing.categories.includes(transaction.category.displayName)) {
          existing.categories.push(transaction.category.displayName)
        }
      } else {
        payeeMap.set(payeeId, {
          payeeId,
          payeeName: transaction.payee.displayName,
          totalAmount: transaction.amount,
          transactionCount: 1,
          avgTransactionAmount: transaction.amount,
          lastTransactionDate: transaction.date,
          categories: transaction.category ? [transaction.category.displayName] : []
        })
      }
    }
  })

  return Array.from(payeeMap.values()).sort((a, b) => b.totalAmount - a.totalAmount)
}

/**
 * Get time period grouping for transactions
 * @description Groups transaction date into specified time period
 * @param date - Transaction date
 * @param grouping - Time grouping type
 * @returns Period information with key, label, and date
 */
function getTimePeriod(date: Date, grouping: TimeGrouping): { key: string; label: string; date: Date } {
  const transactionDate = new Date(date)

  switch (grouping) {
    case 'daily':
      const dayKey = format(transactionDate, 'yyyy-MM-dd')
      return {
        key: dayKey,
        label: format(transactionDate, 'MMM dd'),
        date: transactionDate
      }

    case 'weekly':
      const weekStart = new Date(transactionDate)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekKey = format(weekStart, 'yyyy-MM-dd')
      return {
        key: weekKey,
        label: `Week of ${format(weekStart, 'MMM dd')}`,
        date: weekStart
      }

    case 'monthly':
      const monthKey = format(transactionDate, 'yyyy-MM')
      return {
        key: monthKey,
        label: format(transactionDate, 'MMM yyyy'),
        date: startOfMonth(transactionDate)
      }

    case 'quarterly':
      const quarter = Math.floor(transactionDate.getMonth() / 3) + 1
      const quarterKey = `${transactionDate.getFullYear()}-Q${quarter}`
      return {
        key: quarterKey,
        label: `Q${quarter} ${transactionDate.getFullYear()}`,
        date: startOfQuarter(transactionDate)
      }

    case 'yearly':
      const yearKey = format(transactionDate, 'yyyy')
      return {
        key: yearKey,
        label: format(transactionDate, 'yyyy'),
        date: startOfYear(transactionDate)
      }

    default:
      return {
        key: format(transactionDate, 'yyyy-MM'),
        label: format(transactionDate, 'MMM yyyy'),
        date: startOfMonth(transactionDate)
      }
  }
}

/**
 * Generate color for category
 * @description Creates consistent color for category visualization
 * @param categoryId - Category ID
 * @returns Hex color string
 */
function generateCategoryColor(categoryId: string): string {
  // Simple hash-based color generation for consistency
  let hash = 0
  for (let i = 0; i < categoryId.length; i++) {
    hash = categoryId.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue = 270 + (Math.abs(hash) % 90) // Violet range: 270-360
  return `oklch(0.65 0.15 ${hue})`
}

/**
 * Quick report generation functions for common reports
 */

/**
 * Generate income vs expenses report
 * @description Quick function to generate income vs expenses data
 * @param userId - User ID
 * @param filters - Report filters
 * @returns Promise resolving to report data
 */
export async function generateIncomeVsExpensesReport(userId: string, filters: ReportFilters): Promise<Partial<ReportData>> {
  const transactions = await getTransactions(userId)
  const filteredTransactions = filterTransactions(transactions, filters)
  
  return {
    summary: generateTransactionSummary(filteredTransactions, filters),
    timeSeriesData: generateTimeSeriesData(filteredTransactions, 'monthly')
  }
}

/**
 * Generate category breakdown report
 * @description Quick function to generate category breakdown
 * @param userId - User ID
 * @param filters - Report filters
 * @returns Promise resolving to category breakdown
 */
export async function generateCategoryBreakdownReport(userId: string, filters: ReportFilters): Promise<CategoryBreakdown[]> {
  const transactions = await getTransactions(userId)
  const filteredTransactions = filterTransactions(transactions, filters)
  return generateCategoryBreakdown(filteredTransactions)
} 