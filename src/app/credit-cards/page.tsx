/**
 * @file page.tsx
 * @description This file defines the credit cards page of the expense management application.
 * It provides comprehensive credit card bill management, payment tracking, and upcoming bill notifications.
 */
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { CreditCard, Plus, AlertCircle, TrendingUp, FileText, Eye } from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth } from '@/components/auth/auth-provider'
import {
  getCreditCardSummaries,
  autoGenerateBills,
} from '@/lib/services/credit-card-service'
import {
  CreditCardSummary,
} from '@/types/credit-card'
import { formatCurrency } from '@/lib/currency'
import { toast } from 'sonner'

/**
 * Credit card overview card component
 * @description Displays credit card account overview with usage and limits
 */
function CreditCardOverview({ summary }: { summary: CreditCardSummary }) {
  const { account, currentBalance, creditLimit, availableCredit, creditUsagePercentage } = summary
  const usedAmount = creditLimit - availableCredit

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg">{account.name}</CardTitle>
          <CardDescription>
            {account.creditCardInfo && (
              <>Bill on {account.creditCardInfo.billGenerationDate}th • Due on {account.creditCardInfo.paymentDueDate}th</>
            )}
          </CardDescription>
        </div>
        <CreditCard className="h-6 w-6 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Credit Usage */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Credit Usage</span>
            <span className="font-medium">{(typeof creditUsagePercentage === 'number' ? creditUsagePercentage.toFixed(1) : '0.0')}%</span>
          </div>
          <Progress
            value={typeof creditUsagePercentage === 'number' ? creditUsagePercentage : 0}
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Used: {formatCurrency(usedAmount)}</span>
            <span>Available: {formatCurrency(availableCredit)}</span>
          </div>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Current Balance</div>
            <div className={`font-semibold ${currentBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(Math.abs(currentBalance))}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Credit Limit</div>
            <div className="font-semibold">{formatCurrency(creditLimit)}</div>
          </div>
        </div>

        {/* Next Bill Info */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Next Bill</span>
            <span className="font-medium">
              {format(summary.nextBillGenerationDate, 'MMM dd, yyyy')}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Payment Due</span>
            <span className="font-medium">
              {format(summary.nextPaymentDueDate, 'MMM dd, yyyy')}
            </span>
          </div>
        </div>

        {/* Bill Management Actions */}
        <div className="pt-4 border-t">
          <div className="flex space-x-2">
            <Link href={`/credit-cards/${account.id}/bills`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Manage Bills
              </Button>
            </Link>
            <Link href="/credit-cards/bills" className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                View All Bills
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Main credit cards page component
 * @description Renders the complete credit cards management page
 */
export default function CreditCardsPage() {
  const { user } = useAuth()
  const [summaries, setSummaries] = useState<CreditCardSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  /**
   * Load credit card data
   */
  const loadCreditCardData = useCallback(async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      setError(null)

      // Auto-generate any missing bills first
      await autoGenerateBills(user.id)

      // Then load all credit card summaries
      const creditCardSummaries = await getCreditCardSummaries(user.id)

      setSummaries(creditCardSummaries)
    } catch (err) {
      console.error('Error loading credit card data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load credit card data')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  /**
   * Force refresh account balances and credit usage
   * @description Calls the API to recalculate all account balances and credit usage percentages
   */
  const refreshAccountBalances = useCallback(async () => {
    if (!user?.id) return

    try {
      setIsRefreshing(true)
      toast.info('Refreshing credit card data...')

      // Call the recalculate balances API to force database updates
      const response = await fetch('/api/accounts/recalculate-balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to recalculate account balances')
      }

      const result = await response.json()
      console.log('Balance recalculation result:', result)

      // After forcing balance recalculation, reload the credit card data
      await loadCreditCardData()

      toast.success('Credit card data refreshed successfully')
    } catch (error) {
      console.error('Error refreshing account balances:', error)
      toast.error('Failed to refresh credit card data')
      setError(error instanceof Error ? error.message : 'Failed to refresh credit card data')
    } finally {
      setIsRefreshing(false)
    }
  }, [user?.id, loadCreditCardData])


  useEffect(() => {
    loadCreditCardData()
  }, [loadCreditCardData])

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Credit Cards</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                    <div className="h-3 bg-muted animate-pulse rounded w-1/2"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-2 bg-muted animate-pulse rounded"></div>
                    <div className="h-16 bg-muted animate-pulse rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Credit Cards</h2>
          </div>
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Error Loading Credit Cards</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={loadCreditCardData}>Try Again</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  if (summaries.length === 0) {
    return (
      <ProtectedRoute>
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Credit Cards</h2>
            <Button asChild>
              <a href="/accounts">
                <Plus className="h-4 w-4 mr-2" />
                Add Credit Card
              </a>
            </Button>
          </div>
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Credit Cards Found</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first credit card account to start tracking bills and payments.
                </p>
                <Button asChild>
                  <a href="/accounts">Add Credit Card Account</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Credit Cards</h2>
          <div className="flex space-x-2">
            <Link href="/credit-cards/bills">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Manage All Bills
              </Button>
            </Link>

            <Button
              onClick={refreshAccountBalances}
              variant="outline"
              disabled={isRefreshing}
            >
              <TrendingUp className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </div>

        {/* Credit Card Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {summaries.map((summary) => (
            <CreditCardOverview key={summary.account.id} summary={summary} />
          ))}
        </div>

      </div>
    </ProtectedRoute>
  )
} 