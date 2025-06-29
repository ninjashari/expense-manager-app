/**
 * @file page.tsx
 * @description This file defines the credit cards page of the expense management application.
 * It provides comprehensive credit card bill management, payment tracking, and upcoming bill notifications.
 */
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { format, isAfter, isBefore, addDays } from 'date-fns'
import { CreditCard, Plus, AlertCircle, Clock, CheckCircle, Calendar, TrendingUp } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth } from '@/components/auth/auth-provider'
import { 
  getCreditCardSummaries, 
  autoGenerateBills, 
  markBillAsPaid 
} from '@/lib/services/credit-card-service'
import { 
  CreditCardSummary, 
  CreditCardBill, 
  getBillStatusConfig
} from '@/types/credit-card'
import { formatCurrency } from '@/lib/currency'

/**
 * Credit card bill status badge component
 * @description Renders styled badge for bill status
 */
function BillStatusBadge({ status }: { status: CreditCardBill['status'] }) {
  const config = getBillStatusConfig(status)
  
  const getVariant = (color: string) => {
    switch (color) {
      case 'green': return 'default'
      case 'blue': return 'secondary'
      case 'orange': return 'secondary'
      case 'red': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <Badge variant={getVariant(config.color)} className="text-xs">
      {config.label}
    </Badge>
  )
}

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
            <span className="font-medium">{creditUsagePercentage.toFixed(1)}%</span>
          </div>
          <Progress 
            value={creditUsagePercentage} 
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
      </CardContent>
    </Card>
  )
}

/**
 * Bill item component
 * @description Displays individual credit card bill information
 */
function BillItem({ bill, onMarkAsPaid }: { 
  bill: CreditCardBill
  onMarkAsPaid: (billId: string) => void 
}) {
  const isOverdue = isAfter(new Date(), bill.paymentDueDate) && bill.status !== 'paid'
  const isDueSoon = isBefore(new Date(), bill.paymentDueDate) && 
                   isAfter(addDays(new Date(), 7), bill.paymentDueDate) && 
                   bill.status !== 'paid'

  return (
    <Card className={isOverdue ? 'border-red-200' : isDueSoon ? 'border-orange-200' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium">
                Bill for {format(bill.billPeriodStart, 'MMM dd')} - {format(bill.billPeriodEnd, 'MMM dd, yyyy')}
              </h4>
              <BillStatusBadge status={bill.status} />
              {isOverdue && <AlertCircle className="h-4 w-4 text-red-500" />}
              {isDueSoon && <Clock className="h-4 w-4 text-orange-500" />}
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Generated: {format(bill.billGenerationDate, 'MMM dd, yyyy')}</span>
              <span>Due: {format(bill.paymentDueDate, 'MMM dd, yyyy')}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">
              {formatCurrency(bill.billAmount)}
            </div>
            {bill.paidAmount > 0 && (
              <div className="text-sm text-green-600">
                Paid: {formatCurrency(bill.paidAmount)}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Min: {formatCurrency(bill.minimumPayment)}
            </div>
          </div>
        </div>

        {/* Bill Details */}
        <div className="mt-3 pt-3 border-t">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Previous Balance</div>
              <div className="font-medium">{formatCurrency(bill.previousBalance)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Spending</div>
              <div className="font-medium text-red-600">+{formatCurrency(bill.totalSpending)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Payments</div>
              <div className="font-medium text-green-600">-{formatCurrency(bill.totalPayments)}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {bill.status !== 'paid' && (
          <div className="mt-4 flex gap-2">
            <Button 
              size="sm" 
              onClick={() => onMarkAsPaid(bill.id)}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Paid
            </Button>
          </div>
        )}
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
   * Handle marking bill as paid
   */
  const handleMarkAsPaid = async (billId: string) => {
    if (!user?.id) return

    try {
      // For now, mark as fully paid on current date
      // In a real application, this would open a payment form
      const bill = summaries
        .flatMap(s => s.recentBills)
        .find(b => b.id === billId)
      
      if (bill) {
        await markBillAsPaid({
          billId,
          paymentAmount: bill.billAmount - bill.paidAmount,
          paymentDate: new Date(),
          notes: 'Marked as paid from credit cards page'
        }, user.id)
        
        // Reload data to reflect changes
        await loadCreditCardData()
      }
    } catch (err) {
      console.error('Error marking bill as paid:', err)
      setError(err instanceof Error ? err.message : 'Failed to mark bill as paid')
    }
  }

  useEffect(() => {
    loadCreditCardData()
  }, [user?.id, loadCreditCardData])

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

  // Get all upcoming and overdue bills
  const allBills = summaries.flatMap(s => s.recentBills)
  const upcomingBills = allBills.filter(bill => 
    bill.status === 'generated' || bill.status === 'partial'
  ).sort((a, b) => a.paymentDueDate.getTime() - b.paymentDueDate.getTime())
  
  const overdueBills = allBills.filter(bill => 
    bill.status === 'overdue'
  ).sort((a, b) => a.paymentDueDate.getTime() - b.paymentDueDate.getTime())

  return (
    <ProtectedRoute>
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Credit Cards</h2>
          <Button onClick={loadCreditCardData} variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Credit Card Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {summaries.map((summary) => (
            <CreditCardOverview key={summary.account.id} summary={summary} />
          ))}
        </div>

        {/* Bills Management */}
        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Upcoming Bills ({upcomingBills.length})
            </TabsTrigger>
            <TabsTrigger value="overdue" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Overdue Bills ({overdueBills.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              All Bills
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBills.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-muted-foreground">No upcoming bills</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              upcomingBills.map((bill) => (
                <BillItem
                  key={bill.id}
                  bill={bill}
                  onMarkAsPaid={handleMarkAsPaid}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4">
            {overdueBills.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-muted-foreground">No overdue bills</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              overdueBills.map((bill) => (
                <BillItem
                  key={bill.id}
                  bill={bill}
                  onMarkAsPaid={handleMarkAsPaid}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-6">
            {summaries.map((summary) => (
              <div key={summary.account.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{summary.account.name}</h3>
                  <Badge variant="outline">
                    {summary.recentBills.length} bills
                  </Badge>
                </div>
                <div className="space-y-3">
                  {summary.recentBills.length === 0 ? (
                    <Card>
                      <CardContent className="flex items-center justify-center h-20">
                        <p className="text-muted-foreground">No bills generated yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    summary.recentBills.map((bill) => (
                      <BillItem
                        key={bill.id}
                        bill={bill}
                        onMarkAsPaid={handleMarkAsPaid}
                      />
                    ))
                  )}
                </div>
                {summary !== summaries[summaries.length - 1] && <Separator />}
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
} 