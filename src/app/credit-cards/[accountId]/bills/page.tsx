/**
 * @file page.tsx
 * @description This file defines the individual credit card bill management page.
 * It provides bill generation, viewing, and management for a specific credit card account.
 */
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { format, isAfter, isBefore, addDays } from 'date-fns'
import { 
  CreditCard, 
  Calendar, 
  Download, 
  Search,
  AlertCircle, 
  Clock, 
  CheckCircle,
  FileText,
  TrendingUp,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth } from '@/components/auth/auth-provider'
import { 
  getCreditCardBills,
  getCreditCardAccounts,
  markBillAsPaid,
  generateComprehensiveHistoricalBills,
  recalculateAccountBills
} from '@/lib/services/credit-card-service'
import { 
  CreditCardBill, 
  CreditCardBillStatus,
  getBillStatusConfig
} from '@/types/credit-card'
import { Account } from '@/types/account'
import { formatCurrency } from '@/lib/currency'
import { toast } from 'sonner'

/**
 * Bill status badge component
 */
function BillStatusBadge({ status }: { status: CreditCardBillStatus }) {
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
 * Individual credit card bill management page component
 */
export default function IndividualCreditCardBillsPage() {
  const { user } = useAuth()
  const params = useParams()
  const accountId = params.accountId as string

  const [account, setAccount] = useState<Account | null>(null)
  const [bills, setBills] = useState<CreditCardBill[]>([])
  const [filteredBills, setFilteredBills] = useState<CreditCardBill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingHistorical, setIsGeneratingHistorical] = useState(false)
  const [isRecalculating, setIsRecalculating] = useState(false)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<CreditCardBillStatus | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  /**
   * Load account and bills data
   */
  const loadAccountData = useCallback(async () => {
    if (!user?.id || !accountId) return

    try {
      setIsLoading(true)
      setError(null)
      
      const [accountsData, billsData] = await Promise.all([
        getCreditCardAccounts(user.id),
        getCreditCardBills(accountId, user.id)
      ])
      
      const currentAccount = accountsData.find(acc => acc.id === accountId)
      if (!currentAccount) {
        throw new Error('Credit card account not found')
      }
      
      setAccount(currentAccount)
      setBills(billsData)
      setFilteredBills(billsData)
    } catch (err) {
      console.error('Error loading account data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load account data')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, accountId])

  /**
   * Filter bills based on current filters
   */
  const applyFilters = useCallback(() => {
    let filtered = [...bills]

    if (statusFilter !== 'all') {
      filtered = filtered.filter(bill => bill.status === statusFilter)
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(bill => 
        bill.notes?.toLowerCase().includes(searchLower) ||
        format(bill.billPeriodStart, 'MMM yyyy').toLowerCase().includes(searchLower)
      )
    }

    filtered.sort((a, b) => b.billGenerationDate.getTime() - a.billGenerationDate.getTime())
    setFilteredBills(filtered)
  }, [bills, statusFilter, searchTerm])

  /**
   * Handle generating comprehensive historical bills
   */
  const handleGenerateHistoricalBills = async () => {
    if (!user?.id) return

    try {
      setIsGeneratingHistorical(true)
      const generatedBills = await generateComprehensiveHistoricalBills(user.id)
      const accountBills = generatedBills.filter(bill => bill.accountId === accountId)
      
      if (accountBills.length > 0) {
        toast.success(`Generated ${accountBills.length} historical bills`)
        await loadAccountData()
      } else {
        toast.info('All historical bills are up to date')
      }
    } catch (err) {
      toast.error('Failed to generate historical bills')
    } finally {
      setIsGeneratingHistorical(false)
    }
  }

  /**
   * Handle recalculating all bills for this account
   */
  const handleRecalculateAllBills = async () => {
    if (!user?.id || !accountId) return

    try {
      setIsRecalculating(true)
      const recalculatedCount = await recalculateAccountBills(accountId, user.id)
      
      toast.success(`Recalculated ${recalculatedCount} bills successfully`)
      await loadAccountData()
    } catch (err) {
      toast.error('Failed to recalculate bills')
    } finally {
      setIsRecalculating(false)
    }
  }

  /**
   * Handle marking bill as paid
   */
  const handleMarkAsPaid = async (billId: string) => {
    const bill = bills.find(b => b.id === billId)
    if (!bill) return

    const remainingAmount = Math.max(0, bill.billAmount - bill.paidAmount)
    
    try {
      await markBillAsPaid({
        billId,
        paymentAmount: remainingAmount,
        paymentDate: new Date(),
        notes: 'Full payment via individual account bills page'
      }, user!.id)
      
      toast.success('Bill marked as paid successfully')
      await loadAccountData()
    } catch (err) {
      toast.error('Failed to mark bill as paid')
    }
  }

  /**
   * Calculate account statistics
   */
  const calculateStats = useCallback(() => {
    const totalBills = filteredBills.length
    const unpaidBills = filteredBills.filter(bill => bill.status !== 'paid')
    const overdueBills = filteredBills.filter(bill => 
      isAfter(new Date(), bill.paymentDueDate) && bill.status !== 'paid'
    )

    const totalOutstanding = unpaidBills.reduce((sum, bill) => 
      sum + Math.max(0, bill.billAmount - bill.paidAmount), 0
    )

    return {
      totalBills,
      unpaidBills: unpaidBills.length,
      overdueBills: overdueBills.length,
      totalOutstanding
    }
  }, [filteredBills])

  useEffect(() => {
    loadAccountData()
  }, [loadAccountData])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const stats = calculateStats()

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex-1 space-y-6">
          <div className="text-center py-8">
            <div className="text-lg">Loading account bills...</div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !account) {
    return (
      <ProtectedRoute>
        <div className="flex-1 space-y-6">
          <div className="text-center py-8">
            <div className="text-lg text-red-600">
              {error || 'Account not found'}
            </div>
            <Button onClick={loadAccountData} className="mt-4">
              Try Again
            </Button>
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
            <div className="flex items-center space-x-4 mb-2">
              <Link href="/credit-cards/bills">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to All Bills
                </Button>
              </Link>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">
              {account.name} - Bill Management
            </h2>
            <p className="text-muted-foreground">
              Generate and manage bills for this credit card account
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={handleGenerateHistoricalBills} 
              variant="outline"
              disabled={isGeneratingHistorical}
            >
              <Calendar className="h-4 w-4 mr-2" />
              {isGeneratingHistorical ? 'Generating...' : 'Generate Historical Bills'}
            </Button>
            <Button 
              onClick={handleRecalculateAllBills} 
              variant="outline"
              disabled={isRecalculating}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {isRecalculating ? 'Recalculating...' : 'Recalculate All Bills'}
            </Button>
          </div>
        </div>

        {/* Account Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Account Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="text-sm text-muted-foreground">Current Balance</div>
                <div className={`text-lg font-semibold ${account.currentBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(Math.abs(account.currentBalance))}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Credit Limit</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(account.creditCardInfo?.creditLimit || 0)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Available Credit</div>
                <div className="text-lg font-semibold text-green-600">
                  {formatCurrency((account.creditCardInfo?.creditLimit || 0) + account.currentBalance)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Credit Usage</div>
                <div className="text-lg font-semibold">
                  {account.creditCardInfo?.creditUsagePercentage?.toFixed(1) || '0.0'}%
                </div>
              </div>
            </div>

            {/* Credit Usage Progress */}
            <div className="mt-4">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-muted-foreground">Credit Usage</span>
                <span className="font-medium">{account.creditCardInfo?.creditUsagePercentage?.toFixed(1) || '0.0'}%</span>
              </div>
              <Progress 
                value={account.creditCardInfo?.creditUsagePercentage || 0} 
                className="h-2"
              />
            </div>

            {/* Bill Information */}
            {account.creditCardInfo && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm text-muted-foreground">Bill Generation Date</div>
                    <div className="font-medium">{account.creditCardInfo.billGenerationDate}th of each month</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Payment Due Date</div>
                    <div className="font-medium">{account.creditCardInfo.paymentDueDate}th of each month</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBills}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unpaid Bills</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.unpaidBills}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Bills</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdueBills}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-red-600">
                {formatCurrency(stats.totalOutstanding)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as CreditCardBillStatus | 'all')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="generated">Generated</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bills List */}
        <Card>
          <CardHeader>
            <CardTitle>Bills ({filteredBills.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredBills.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-lg font-medium">No bills found</div>
                <div className="text-muted-foreground">
                  {bills.length === 0 
                    ? 'No bills have been generated yet for this account.' 
                    : 'Try adjusting your filters to see more bills.'
                  }
                </div>
                {bills.length === 0 && (
                  <Button onClick={handleGenerateHistoricalBills} className="mt-4">
                    Generate Historical Bills
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBills.map((bill) => {
                  const isOverdue = isAfter(new Date(), bill.paymentDueDate) && bill.status !== 'paid'
                  const isDueSoon = isBefore(new Date(), bill.paymentDueDate) && 
                                   isAfter(addDays(new Date(), 7), bill.paymentDueDate) && 
                                   bill.status !== 'paid'
                  const remainingAmount = Math.max(0, bill.billAmount - bill.paidAmount)

                  return (
                    <Card 
                      key={bill.id} 
                      className={`${isOverdue ? 'border-red-200' : isDueSoon ? 'border-orange-200' : ''}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-semibold text-lg">
                                Bill for {format(bill.billPeriodStart, 'MMM dd')} - {format(bill.billPeriodEnd, 'MMM dd, yyyy')}
                              </h4>
                              <BillStatusBadge status={bill.status} />
                              {isOverdue && <AlertCircle className="h-5 w-5 text-red-500" />}
                              {isDueSoon && <Clock className="h-5 w-5 text-orange-500" />}
                            </div>
                            
                            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                              <span>Generated: {format(bill.billGenerationDate, 'MMM dd, yyyy')}</span>
                              <span>Due: {format(bill.paymentDueDate, 'MMM dd, yyyy')}</span>
                              {bill.paidDate && (
                                <span className="text-green-600">
                                  Paid: {format(bill.paidDate, 'MMM dd, yyyy')}
                                </span>
                              )}
                            </div>

                            {/* Bill breakdown */}
                            <div className="grid grid-cols-4 gap-6 pt-2 text-sm">
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
                              <div>
                                <div className="text-muted-foreground">Min Payment</div>
                                <div className="font-medium">{formatCurrency(bill.minimumPayment)}</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right space-y-3">
                            {/* Amount display */}
                            <div className="space-y-1">
                              <div className="text-2xl font-bold">
                                {remainingAmount > 0 ? (
                                  <span className="text-red-600">
                                    {formatCurrency(remainingAmount)}
                                  </span>
                                ) : (
                                  <span className="text-green-600 flex items-center justify-end">
                                    <CheckCircle className="h-5 w-5 mr-1" />
                                    Paid
                                  </span>
                                )}
                              </div>
                              
                              <div className="text-sm text-muted-foreground">
                                Total: {formatCurrency(bill.billAmount)}
                                {bill.paidAmount > 0 && (
                                  <span className="text-green-600 block">
                                    Paid: {formatCurrency(bill.paidAmount)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col space-y-2">
                              {remainingAmount > 0 && (
                                <Button 
                                  onClick={() => handleMarkAsPaid(bill.id)}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Mark as Paid
                                </Button>
                              )}
                              
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                Download PDF
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
