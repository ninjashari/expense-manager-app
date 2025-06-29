/**
 * @file use-dashboard-stats.ts
 * @description This file contains a custom hook for fetching and calculating dashboard statistics.
 * It provides comprehensive financial metrics, recent transactions, and chart data for the dashboard.
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { Transaction } from '@/types/transaction'
import { Account } from '@/types/account'
import { TimeSeriesData } from '@/types/report'

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
  // Handle invalid inputs
  if (!isFinite(current) || !isFinite(previous)) {
    return 0
  }
  
  // If previous is 0, return 100% if current > 0, 0% if current is 0, -100% if current < 0
  if (previous === 0) {
    if (current > 0) return 100
    if (current < 0) return -100
    return 0
  }
  
  const change = ((current - previous) / Math.abs(previous)) * 100
  return isFinite(change) ? change : 0
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
      // If no user, set empty state instead of loading
      setStats(prev => ({ 
        ...prev, 
        isLoading: false,
        error: user === null ? 'Please sign in to view your dashboard' : null
      }))
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

        // Check if responses are ok and handle errors properly
        if (!transactionsResponse.ok) {
          const errorText = await transactionsResponse.text()
          console.error('Transactions API error:', errorText)
          throw new Error(`Failed to fetch transactions: ${transactionsResponse.status} ${transactionsResponse.statusText}`)
        }

        if (!accountsResponse.ok) {
          const errorText = await accountsResponse.text()
          console.error('Accounts API error:', errorText)
          throw new Error(`Failed to fetch accounts: ${accountsResponse.status} ${accountsResponse.statusText}`)
        }

        const transactionsData = await transactionsResponse.json()
        const accountsData = await accountsResponse.json()

        // Ensure we have the expected data structure
        if (!transactionsData?.transactions || !Array.isArray(transactionsData.transactions)) {
          throw new Error('Invalid transactions data format')
        }

        if (!accountsData?.accounts || !Array.isArray(accountsData.accounts)) {
          throw new Error('Invalid accounts data format')
        }

        const transactions = transactionsData.transactions as Transaction[]
        const accounts = accountsData.accounts as Account[]

        // Calculate statistics
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

        // Total balance across all accounts
        const totalBalance = accounts.reduce((sum, account) => sum + (Number(account.currentBalance) || 0), 0)

        // Filter transactions for current month
        const currentMonthTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate.getMonth() === currentMonth && 
                 transactionDate.getFullYear() === currentYear
        })

        // Filter transactions for previous month
        const lastMonthTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate.getMonth() === lastMonth && 
                 transactionDate.getFullYear() === lastMonthYear
        })

        // Calculate monthly income and expenses - only completed transactions
        const monthlyIncome = currentMonthTransactions
          .filter(t => t.type === 'deposit' && t.status === 'completed')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

        const monthlyExpenses = currentMonthTransactions
          .filter(t => t.type === 'withdrawal' && t.status === 'completed')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

        const lastMonthIncome = lastMonthTransactions
          .filter(t => t.type === 'deposit' && t.status === 'completed')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

        const lastMonthExpenses = lastMonthTransactions
          .filter(t => t.type === 'withdrawal' && t.status === 'completed')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

        // Calculate total income and expenses (all time) - only completed transactions
        const totalIncome = transactions
          .filter(t => t.type === 'deposit' && t.status === 'completed')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

        const totalExpenses = transactions
          .filter(t => t.type === 'withdrawal' && t.status === 'completed')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

        // Calculate changes
        const incomeChange = calculatePercentageChange(monthlyIncome, lastMonthIncome)
        const expenseChange = calculatePercentageChange(monthlyExpenses, lastMonthExpenses)

        // Get recent transactions (last 10 completed transactions)
        const recentTransactions = transactions
          .filter((t: Transaction) => t.status === 'completed')
          .slice(0, 10)

        // Calculate account balances
        const accountBalances = accounts.map((account: Account) => ({
          account,
          balance: Number(account.currentBalance) || 0
        }))

        setStats({
          totalBalance,
          totalIncome,
          totalExpenses,
          netIncome: totalIncome - totalExpenses,
          monthlyIncome,
          monthlyExpenses,
          monthlyNet: monthlyIncome - monthlyExpenses,
          incomeChange,
          expenseChange,
          chartData: [], // Empty for now, can be populated later if needed
          recentTransactions,
          accountBalances,
          isLoading: false,
          error: null
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
  }, [user])

  return stats
} 