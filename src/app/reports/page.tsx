/**
 * @file page.tsx
 * @description This file defines the comprehensive reports page of the expense management application.
 * It provides advanced financial analytics with customizable reports, filters, and visualizations.
 */
"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, Settings, Download } from "lucide-react"
import { toast } from "sonner"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { CustomReportBuilder } from "@/components/reports/custom-report-builder"
import { 
  SummaryCards, 
  IncomeVsExpensesChart, 
  CategoryBreakdownChart
} from "@/components/reports/report-charts"

// Import services and types
import { getAccounts } from "@/lib/services/supabase-account-service"
import { getCategories } from "@/lib/services/supabase-category-service"
import { getPayees } from "@/lib/services/supabase-payee-service"
import { generateIncomeVsExpensesReport, generateCategoryBreakdownReport } from "@/lib/services/report-service"
import { supabase } from "@/lib/supabase"

import { Account } from "@/types/account"
import { Category } from "@/types/category"
import { Payee } from "@/types/payee"
import { DEFAULT_REPORT_FILTERS, TransactionSummary, TimeSeriesData, CategoryBreakdown } from "@/types/report"

/**
 * ReportsPage component
 * @description Renders the comprehensive reports and analytics page with customizable features
 * @returns JSX element containing the reports page content
 */
export default function ReportsPage() {
  // Data state
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [payees, setPayees] = useState<Payee[]>([])
  const [userId, setUserId] = useState<string>('')

  // Loading state
  const [isLoading, setIsLoading] = useState(true)

  // Quick reports data
  const [quickReportsData, setQuickReportsData] = useState<{
    incomeVsExpenses?: {
      summary?: TransactionSummary;
      timeSeriesData?: TimeSeriesData[];
    }
    categoryBreakdown?: CategoryBreakdown[]
  }>({})

  // Current tab
  const [activeTab, setActiveTab] = useState('dashboard')

  /**
   * Load initial data for reports
   * @description Fetches accounts, categories, payees, and user info
   */
  const loadReportData = async () => {
    try {
      setIsLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to view reports')
        return
      }
      
      setUserId(user.id)

      // Load all necessary data in parallel
      const [accountsData, categoriesData, payeesData] = await Promise.all([
        getAccounts(user.id),
        getCategories(user.id),
        getPayees(user.id)
      ])

      setAccounts(accountsData)
      setCategories(categoriesData)
      setPayees(payeesData)

      // Generate quick reports for dashboard
      await generateQuickReports(user.id)

    } catch (error) {
      console.error('Error loading report data:', error)
      toast.error('Failed to load report data')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Generate quick reports for dashboard overview
   * @description Creates quick reports with default filters
   */
  const generateQuickReports = async (currentUserId: string) => {
    try {
      const defaultFilters = {
        ...DEFAULT_REPORT_FILTERS,
        dateRange: 'this_month' as const
      }

      const [incomeVsExpenses, categoryBreakdown] = await Promise.all([
        generateIncomeVsExpensesReport(currentUserId, defaultFilters),
        generateCategoryBreakdownReport(currentUserId, defaultFilters)
      ])

      setQuickReportsData({
        incomeVsExpenses,
        categoryBreakdown
      })
    } catch (error) {
      console.error('Error generating quick reports:', error)
    }
  }

  // Load data on component mount
  useEffect(() => {
    loadReportData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-4 bg-muted rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-muted rounded animate-pulse w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] bg-muted rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex-1 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
            <p className="text-muted-foreground">
              Comprehensive financial insights with customizable reports and advanced filtering
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => generateQuickReports(userId)}>
              <Download className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Main Report Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Custom Reports
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab - Quick Overview */}
          <TabsContent value="dashboard" className="space-y-6">
            {quickReportsData.incomeVsExpenses?.summary && (
              <SummaryCards summary={quickReportsData.incomeVsExpenses.summary} />
            )}
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Income vs Expenses Chart */}
              {quickReportsData.incomeVsExpenses?.timeSeriesData && (
                <IncomeVsExpensesChart
                  data={quickReportsData.incomeVsExpenses.timeSeriesData}
                  chartType="bar"
                  title="This Month: Income vs Expenses"
                  description="Your financial overview for the current month"
                />
              )}

              {/* Category Breakdown */}
              {quickReportsData.categoryBreakdown && quickReportsData.categoryBreakdown.length > 0 && (
                <CategoryBreakdownChart
                  data={quickReportsData.categoryBreakdown}
                  chartType="pie"
                  title="This Month: Category Breakdown"
                  description="Where your money is going this month"
                />
              )}

              {/* Monthly Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Monthly Trends
                  </CardTitle>
                  <CardDescription>
                    Track your spending patterns over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Use Custom Reports to create detailed trend analysis</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setActiveTab('custom')}
                    >
                      Create Custom Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Account Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Account Performance
                  </CardTitle>
                  <CardDescription>
                    Compare performance across your accounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Create custom reports to analyze account performance</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setActiveTab('custom')}
                    >
                      Analyze Accounts
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Custom Reports Tab */}
          <TabsContent value="custom">
            <CustomReportBuilder
              accounts={accounts}
              categories={categories}
              payees={payees}
              userId={userId}
            />
          </TabsContent>


        </Tabs>
      </div>
    </ProtectedRoute>
  )
} 