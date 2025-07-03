/**
 * @file page.tsx
 * @description This file defines the dashboard page of the expense management application.
 * It provides a comprehensive financial overview with real-time data, charts, and recent transactions.
 */
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { IncomeVsExpensesChart } from "@/components/reports/report-charts"
import { DashboardSummaryCards, RecentTransactions } from "@/components/dashboard"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"

/**
 * Dashboard component
 * @description Renders the main dashboard page with comprehensive financial overview
 * @returns JSX element containing the dashboard content with real data
 */
export default function DashboardPage() {
  const {
    totalBalance,
    totalIncome,
    totalExpenses,
    netIncome,
    monthlyIncome,
    monthlyExpenses,
    monthlyNet,
    incomeChange,
    expenseChange,
    chartData,
    chartDescription,
    recentTransactions,
    isLoading,
    error
  } = useDashboardStats()

  return (
    <ProtectedRoute>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        
        {/* Summary Cards */}
        <DashboardSummaryCards
          totalBalance={totalBalance}
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          netIncome={netIncome}
          monthlyIncome={monthlyIncome}
          monthlyExpenses={monthlyExpenses}
          monthlyNet={monthlyNet}
          incomeChange={incomeChange}
          expenseChange={expenseChange}
          isLoading={isLoading}
          error={error}
        />
        
        {/* Charts and Recent Transactions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Overview Chart */}
          <div className="col-span-4">
            {isLoading ? (
              <Card>
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                  <CardDescription>Loading your financial overview...</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="flex h-[400px] items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading chart data...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                  <CardDescription>Unable to load financial overview</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <p className="text-sm text-red-500">Failed to load chart data</p>
                      <p className="text-xs mt-1">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : chartData.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                  <CardDescription>Your financial overview will appear here</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <p className="text-sm">No transaction data available</p>
                      <p className="text-xs mt-1">Add some transactions to see your financial overview</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <IncomeVsExpensesChart
                data={chartData}
                chartType="bar"
                title="Income vs Expenses Overview"
                description={chartDescription}
              />
            )}
          </div>
          
          {/* Recent Transactions */}
          <RecentTransactions
            transactions={recentTransactions}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
    </ProtectedRoute>
  )
} 