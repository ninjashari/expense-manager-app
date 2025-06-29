/**
 * @file use-dashboard-stats.ts
 * @description This file contains a custom hook for fetching and calculating dashboard statistics.
 * It provides comprehensive financial metrics, recent transactions, and chart data for the dashboard.
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { generateTimeSeriesData, generateTransactionSummary, filterTransactions } from '@/lib/services/report-service'
import { Transaction } from '@/types/transaction'
import { Account } from '@/types/account'
import { TimeSeriesData, ReportFilters } from '@/types/report'
import { startOfMonth, subMonths } from 'date-fns'

/**
 * Dashboard statistics interface
 * @description Comprehensive dashboard data structure
 */
export interface DashboardStats {
  // Summary metrics
  totalBalance: number
  totalIncome: number
  totalExpenses: number
  netIncome: number
  
  // This month metrics
  monthlyIncome: number
  monthlyExpenses: number
  monthlyNet: number
  
  // Performance indicators
  incomeChange: number // percentage change from last month
  expenseChange: number // percentage change from last month
  
  // Chart data
  chartData: TimeSeriesData[]
  
  // Recent transactions (last 10)
  recentTransactions: Transaction[]
  
  // Account balances
  accountBalances: {
    account: Account
    balance: number
  }[]
  
  // Loading and error states
  isLoading: boolean
  error: string | null
}

/**
 * Calculate balance change between two periods
 * @description Helper function to calculate percentage change
 * @param current - Current period amount
 * @param previous - Previous period amount
 * @returns Percentage change (positive for increase, negative for decrease)
 */
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / Math.abs(previous)) * 100
}

/**
 * Custom hook for dashboard statistics
 * @description Fetches and calculates comprehensive dashboard metrics
 * @returns Dashboard statistics and loading states
 */
export function useDashboardStats(): DashboardStats {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyNet: 0,
    incomeChange: 0,
    expenseChange: 0,
    chartData: [],
    recentTransactions: [],
    accountBalances: [],
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    if (!user?.id) {
      setStats(prev => ({ ...prev, isLoading: false }))
      return
    }

    const fetchDashboardData = async () => {
      try {
        setStats(prev => ({ ...prev, isLoading: true, error: null }))

        // Fetch all necessary data in parallel via API routes
        const [transactionsResponse, accountsResponse] = await Promise.all([
          fetch('/api/transactions'),
          fetch('/api/accounts')
        ])

        if (!transactionsResponse.ok || !accountsResponse.ok) {
          throw new Error('Failed to fetch data from API')
        }

        const transactionsData = await transactionsResponse.json()
        const accountsData = await accountsResponse.json()
        
        const transactions: Transaction[] = transactionsData.transactions
        const accounts: Account[] = accountsData.accounts

        // Calculate date ranges
        const now = new Date()
        const startOfCurrentMonth = startOfMonth(now)
        const startOfLastMonth = startOfMonth(subMonths(now, 1))

        // Filter transactions for different periods
        const allTimeFilters: ReportFilters = {
          dateRange: 'all_time',
          accountIds: [],
          categoryIds: [],
          payeeIds: [],
          transactionTypes: [],
          transactionStatuses: ['completed'],
          accountTypes: [],
          includeNotes: false,
        }

        const currentMonthFilters: ReportFilters = {
          ...allTimeFilters,
          dateRange: 'custom',
          startDate: startOfCurrentMonth,
          endDate: now,
        }

        const lastMonthFilters: ReportFilters = {
          ...allTimeFilters,
          dateRange: 'custom',
          startDate: startOfLastMonth,
          endDate: startOfCurrentMonth,
        }

        // Filter transactions for each period
        const allTransactions = filterTransactions(transactions, allTimeFilters)
        const currentMonthTransactions = filterTransactions(transactions, currentMonthFilters)
        const lastMonthTransactions = filterTransactions(transactions, lastMonthFilters)

        // Generate summaries
        const allTimeSummary = generateTransactionSummary(allTransactions, allTimeFilters)
        const currentMonthSummary = generateTransactionSummary(currentMonthTransactions, currentMonthFilters)
        const lastMonthSummary = generateTransactionSummary(lastMonthTransactions, lastMonthFilters)

        // Calculate performance indicators
        const incomeChange = calculatePercentageChange(
          currentMonthSummary.totalIncome,
          lastMonthSummary.totalIncome
        )
        const expenseChange = calculatePercentageChange(
          currentMonthSummary.totalExpenses,
          lastMonthSummary.totalExpenses
        )

        // Generate chart data for current month only
        const chartFilters: ReportFilters = {
          ...allTimeFilters,
          dateRange: 'this_month',
        }
        const chartTransactions = filterTransactions(transactions, chartFilters)
        const chartData = generateTimeSeriesData(chartTransactions, 'monthly')

        // Get recent transactions (last 10 completed transactions)
        const recentTransactions = transactions
          .filter((t: Transaction) => t.status === 'completed')
          .slice(0, 10)

        // Calculate account balances
        const accountBalances = accounts.map((account: Account) => ({
          account,
          balance: account.currentBalance
        }))

        // Calculate total balance (sum of all active accounts, excluding credit card limits)
        const totalBalance = accounts
          .filter((account: Account) => account.status === 'active')
          .reduce((sum: number, account: Account) => {
            // For credit cards, don't include credit limit in total balance
            if (account.type === 'credit_card') {
              return sum // Don't add credit card balances to total balance
            }
            return sum + account.currentBalance
          }, 0)

        // Update state with calculated statistics
        setStats({
          totalBalance,
          totalIncome: allTimeSummary.totalIncome,
          totalExpenses: allTimeSummary.totalExpenses,
          netIncome: allTimeSummary.netIncome,
          monthlyIncome: currentMonthSummary.totalIncome,
          monthlyExpenses: currentMonthSummary.totalExpenses,
          monthlyNet: currentMonthSummary.netIncome,
          incomeChange,
          expenseChange,
          chartData, // Current month data
          recentTransactions,
          accountBalances,
          isLoading: false,
          error: null,
        })

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setStats(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load dashboard data'
        }))
      }
    }

    fetchDashboardData()
  }, [user?.id])

  return stats
} 