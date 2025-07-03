/**
 * @file report.ts
 * @description This file contains type definitions for the reports and analytics system.
 * It defines the structure for report filters, configurations, and data analysis.
 */

import { TransactionType, TransactionStatus } from './transaction'
import { AccountType } from './account'

// Forward declare Transaction to avoid circular imports
import type { Transaction } from './transaction'

/**
 * Date range presets for quick selection
 * @description Common date range options for reports
 */
export type DateRangePreset = 
  | 'today'
  | 'yesterday' 
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year'
  | 'this_financial_year'
  | 'last_financial_year'
  | 'all_time'
  | 'custom'

/**
 * Report filter configuration
 * @description Comprehensive filtering options for reports
 */
export interface ReportFilters {
  // Date filtering
  dateRangePreset: DateRangePreset
  startDate?: Date
  endDate?: Date
  
  // Entity filtering
  accountIds: string[]
  categoryIds: string[]
  payeeIds: string[]
  
  // Transaction filtering
  transactionTypes: TransactionType[]
  transactionStatuses: TransactionStatus[]
  
  // Amount filtering
  minAmount?: number
  maxAmount?: number
  
  // Account type filtering
  accountTypes: AccountType[]
  
  // Search/text filtering
  searchTerm?: string
  includeNotes?: boolean
}

/**
 * Report type enumeration
 * @description Different types of reports available
 */
export type ReportType = 
  | 'transaction_summary'
  | 'income_vs_expenses'
  | 'category_breakdown'
  | 'account_performance'
  | 'payee_analysis'
  | 'monthly_trends'
  | 'yearly_trends'
  | 'custom_analysis'

/**
 * Chart type enumeration
 * @description Available chart types for visualizations
 */
export type ChartType = 
  | 'bar'
  | 'line'
  | 'pie'
  | 'doughnut'
  | 'area'
  | 'stacked_bar'
  | 'combo'

/**
 * Time grouping options
 * @description How to group data by time periods
 */
export type TimeGrouping = 
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'

/**
 * Report configuration
 * @description Complete configuration for generating a report
 */
export interface ReportConfig {
  id?: string
  name: string
  description?: string
  type: ReportType
  filters: ReportFilters
  chartType?: ChartType
  timeGrouping?: TimeGrouping
  showTable?: boolean
  showChart?: boolean
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Transaction summary data
 * @description Aggregated transaction data for reports
 */
export interface TransactionSummary {
  totalIncome: number
  totalExpenses: number
  netIncome: number
  transactionCount: number
  avgTransactionAmount: number
  dateRange: {
    start: Date
    end: Date
  }
}

/**
 * Category breakdown data
 * @description Expense breakdown by category
 */
export interface CategoryBreakdown {
  categoryId: string
  categoryName: string
  amount: number
  percentage: number
  transactionCount: number
  color?: string
}

/**
 * Time series data point
 * @description Data point for time-based charts
 */
export interface TimeSeriesData {
  period: string // Date string or period label
  date: Date
  income: number
  expenses: number
  net: number
  transactionCount: number
}

/**
 * Account performance data
 * @description Performance metrics for accounts
 */
export interface AccountPerformance {
  accountId: string
  accountName: string
  accountType: AccountType
  startingBalance: number
  endingBalance: number
  totalIncome: number
  totalExpenses: number
  netChange: number
  transactionCount: number
}

/**
 * Payee analysis data
 * @description Analysis of transactions by payee
 */
export interface PayeeAnalysis {
  payeeId: string
  payeeName: string
  totalAmount: number
  transactionCount: number
  avgTransactionAmount: number
  lastTransactionDate: Date
  categories: string[]
}

/**
 * Complete report data
 * @description All possible data that can be included in a report
 */
export interface ReportData {
  config: ReportConfig
  summary: TransactionSummary
  categoryBreakdown: CategoryBreakdown[]
  timeSeriesData: TimeSeriesData[]
  accountPerformance: AccountPerformance[]
  payeeAnalysis: PayeeAnalysis[]
  rawTransactions?: Transaction[] // For detailed transaction lists
}

/**
 * Export format options
 * @description Available formats for exporting reports
 */
export type ExportFormat = 'pdf' | 'csv' | 'xlsx' | 'png' | 'jpg'

/**
 * Date range preset configurations
 * @description Pre-configured date ranges with labels
 */
export const DATE_RANGE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'this_financial_year', label: 'This Financial Year' },
  { value: 'last_financial_year', label: 'Last Financial Year' },
  { value: 'all_time', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
] as const

/**
 * Report type configuration interface
 * @description Structure for report type configuration
 */
export interface ReportTypeConfig {
  type: ReportType
  label: string
  description: string
  defaultChartType: ChartType
  allowedChartTypes: ChartType[]
}

/**
 * Report type configurations
 * @description Pre-configured report types with metadata
 */
export const REPORT_TYPE_CONFIGS: ReportTypeConfig[] = [
  {
    type: 'transaction_summary',
    label: 'Transaction Summary',
    description: 'Detailed list of filtered transactions with totals',
    defaultChartType: 'bar',
    allowedChartTypes: ['bar', 'line', 'area'],
  },
  {
    type: 'income_vs_expenses',
    label: 'Income vs Expenses',
    description: 'Compare income and expenses over time',
    defaultChartType: 'bar',
    allowedChartTypes: ['bar', 'line', 'area', 'stacked_bar', 'combo'],
  },
  {
    type: 'category_breakdown',
    label: 'Category Breakdown',
    description: 'See where your money goes by category',
    defaultChartType: 'pie',
    allowedChartTypes: ['pie', 'doughnut', 'bar'],
  },
  {
    type: 'account_performance',
    label: 'Account Performance',
    description: 'Track performance across different accounts',
    defaultChartType: 'bar',
    allowedChartTypes: ['bar', 'line', 'area'],
  },
  {
    type: 'payee_analysis',
    label: 'Payee Analysis',
    description: 'Analyze transactions by payee',
    defaultChartType: 'bar',
    allowedChartTypes: ['bar', 'pie', 'doughnut'],
  },
  {
    type: 'monthly_trends',
    label: 'Monthly Trends',
    description: 'Track spending patterns month by month',
    defaultChartType: 'line',
    allowedChartTypes: ['line', 'area', 'bar'],
  },
  {
    type: 'yearly_trends',
    label: 'Yearly Trends',
    description: 'Long-term financial trends and patterns',
    defaultChartType: 'line',
    allowedChartTypes: ['line', 'area', 'bar'],
  },
  {
    type: 'custom_analysis',
    label: 'Custom Analysis',
    description: 'Build your own custom report with flexible options',
    defaultChartType: 'bar',
    allowedChartTypes: ['bar', 'line', 'pie', 'doughnut', 'area', 'stacked_bar', 'combo'],
  },
] as const

/**
 * Utility function to get date range from preset
 * @description Calculates start and end dates for preset ranges
 * @param preset - Date range preset
 * @returns Object with start and end dates
 */
export function getDateRangeFromPreset(preset: DateRangePreset): { start: Date; end: Date } | null {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (preset) {
    case 'today':
      return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) }
    
    case 'yesterday':
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return { start: yesterday, end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1) }
    
    case 'last_7_days':
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return { start: sevenDaysAgo, end: now }
    
    case 'last_30_days':
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return { start: thirtyDaysAgo, end: now }
    
    case 'this_month':
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: thisMonthStart, end: now }
    
    case 'last_month':
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      return { start: lastMonthStart, end: lastMonthEnd }
    
    case 'this_quarter':
      const quarter = Math.floor(now.getMonth() / 3)
      const quarterStart = new Date(now.getFullYear(), quarter * 3, 1)
      return { start: quarterStart, end: now }
    
    case 'last_quarter':
      const lastQuarter = Math.floor(now.getMonth() / 3) - 1
      const lastQuarterYear = lastQuarter < 0 ? now.getFullYear() - 1 : now.getFullYear()
      const lastQuarterMonth = lastQuarter < 0 ? 9 : lastQuarter * 3
      const lastQuarterStart = new Date(lastQuarterYear, lastQuarterMonth, 1)
      const lastQuarterEnd = new Date(lastQuarterYear, lastQuarterMonth + 3, 0, 23, 59, 59)
      return { start: lastQuarterStart, end: lastQuarterEnd }
    
    case 'this_year':
      const thisYearStart = new Date(now.getFullYear(), 0, 1)
      return { start: thisYearStart, end: now }
    
    case 'last_year':
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1)
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59)
      return { start: lastYearStart, end: lastYearEnd }
    
    case 'this_financial_year':
      // Financial year in India runs from April 1st to March 31st
      const currentFinancialYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
      const thisFinYearStart = new Date(currentFinancialYear, 3, 1) // April 1st
      return { start: thisFinYearStart, end: now }
    
    case 'last_financial_year':
      // Previous financial year
      const lastFinancialYear = now.getMonth() >= 3 ? now.getFullYear() - 1 : now.getFullYear() - 2
      const lastFinYearStart = new Date(lastFinancialYear, 3, 1) // April 1st
      const lastFinYearEnd = new Date(lastFinancialYear + 1, 2, 31, 23, 59, 59) // March 31st
      return { start: lastFinYearStart, end: lastFinYearEnd }
    
    case 'all_time':
      // Return a very early date as start
      return { start: new Date(2000, 0, 1), end: now }
    
    case 'custom':
    default:
      return null
  }
}

/**
 * Default report filters
 * @description Default configuration for report filters
 */
export const DEFAULT_REPORT_FILTERS: ReportFilters = {
  dateRangePreset: 'this_financial_year',
  accountIds: [],
  categoryIds: [],
  payeeIds: [],
  transactionTypes: ['deposit', 'withdrawal', 'transfer'],
  transactionStatuses: ['completed'],
  accountTypes: [],
  includeNotes: false,
} 