/**
 * @file page.tsx
 * @description This file defines the comprehensive reports page of the expense management application.
 * It provides advanced financial analytics with customizable reports, filters, and visualizations.
 */
"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { toast } from "sonner"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/components/auth/auth-provider"
import { CustomReportBuilder } from "@/components/reports/custom-report-builder"

// API functions
const getAccounts = async (): Promise<Account[]> => {
  const res = await fetch('/api/accounts')
  if (!res.ok) throw new Error('Failed to fetch accounts')
  const data = await res.json()
  return data.accounts
}

const getCategories = async (): Promise<Category[]> => {
  const res = await fetch('/api/categories')
  if (!res.ok) throw new Error('Failed to fetch categories')
  const data = await res.json()
  return data.categories
}

const getPayees = async (): Promise<Payee[]> => {
  const res = await fetch('/api/payees')
  if (!res.ok) throw new Error('Failed to fetch payees')
  const data = await res.json()
  return data.payees
}

import { Account } from "@/types/account"
import { Category } from "@/types/category"
import { Payee } from "@/types/payee"

/**
 * ReportsPage component
 * @description Renders the comprehensive reports and analytics page with customizable features
 * @returns JSX element containing the reports page content
 */
export default function ReportsPage() {
  // Authentication
  const { user } = useAuth()
  
  // Data state
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [payees, setPayees] = useState<Payee[]>([])

  // Loading state
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Load initial data for reports
   * @description Fetches accounts, categories, and payees
   */
  const loadReportData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      if (!user?.id) {
        toast.error('Please sign in to view reports')
        return
      }

      // Load all necessary data in parallel
      const [accountsData, categoriesData, payeesData] = await Promise.all([
        getAccounts(),
        getCategories(),
        getPayees()
      ])

      setAccounts(accountsData)
      setCategories(categoriesData)
      setPayees(payeesData)

    } catch (error) {
      console.error('Error loading report data:', error)
      toast.error('Failed to load report data')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // Load data when user is available
  useEffect(() => {
    if (user?.id) {
      loadReportData()
    }
  }, [user?.id, loadReportData])

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
            <Button variant="outline" onClick={() => loadReportData()}>
              <Download className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Main Report Interface */}
        <CustomReportBuilder
          accounts={accounts}
          categories={categories}
          payees={payees}
        />
      </div>
    </ProtectedRoute>
  )
} 