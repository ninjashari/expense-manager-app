/**
 * @file page.tsx
 * @description This file defines the comprehensive credit card bills overview page.
 * It provides centralized bill management, filtering, and viewing for all credit cards.
 */
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { format, isAfter, isBefore, addDays, startOfMonth, endOfMonth } from 'date-fns'
import { 
  CreditCard, 
  Filter, 
  Calendar, 
  Download, 
  Search,
  Eye,
  AlertCircle, 
  Clock, 
  CheckCircle,
  Plus,
  FileText,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth } from '@/components/auth/auth-provider'
import { 
  getAllCreditCardBills,
  getCreditCardAccounts,
  markBillAsPaid,
  generateComprehensiveHistoricalBills
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
 * @description Renders styled badge for bill status
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
 * Bill filter interface
 * @description Structure for bill filtering options
 */
interface BillFilters {
  accountId?: string
  status?: CreditCardBillStatus
  dateFrom?: Date
  dateTo?: Date
  searchTerm?: string
}

/**
 * Bills overview page component
 * @description Main component for comprehensive credit card bills management
 */
export default function CreditCardBillsPage() {
  const { user } = useAuth()
  const [bills, setBills] = useState<CreditCardBill[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [filteredBills, setFilteredBills] = useState<CreditCardBill[]>([])
  const [filters, setFilters] = useState<BillFilters>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingHistorical, setIsGeneratingHistorical] = useState(false)

  /**
   * Load all bills and accounts data
   */
  const loadBillsData = useCallback(async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      setError(null)
      
      const [billsData, accountsData] = await Promise.all([
        getAllCreditCardBills(user.id),
        getCreditCardAccounts(user.id)
      ])
      
      // Attach account information to bills
      const billsWithAccounts = billsData.map(bill => ({
        ...bill,
        account: accountsData.find(acc => acc.id === bill.accountId)
      }))
      
      setBills(billsWithAccounts)
      setAccounts(accountsData)
      setFilteredBills(billsWithAccounts)
    } catch (err) {
      console.error('Error loading bills data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load bills data')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  /**
   * Filter bills based on current filters
   */
  const applyFilters = useCallback(() => {
    let filtered = [...bills]

    // Filter by account
    if (filters.accountId) {
      filtered = filtered.filter(bill => bill.accountId === filters.accountId)
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(bill => bill.status === filters.status)
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(bill => bill.billGenerationDate >= filters.dateFrom!)
    }
    if (filters.dateTo) {
      filtered = filtered.filter(bill => bill.billGenerationDate <= filters.dateTo!)
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(bill => 
        bill.account?.name.toLowerCase().includes(searchLower) ||
        bill.notes?.toLowerCase().includes(searchLower)
      )
    }

    // Sort by bill generation date (newest first)
    filtered.sort((a, b) => b.billGenerationDate.getTime() - a.billGenerationDate.getTime())

    setFilteredBills(filtered)
  }, [bills, filters])

  /**
   * Handle generating comprehensive historical bills
   */
  const handleGenerateHistoricalBills = async () => {
    if (!user?.id) return

    try {
      setIsGeneratingHistorical(true)
      setError(null)
      
      const generatedBills = await generateComprehensiveHistoricalBills(user.id)
      
      if (generatedBills.length > 0) {
        toast.success(`Generated ${generatedBills.length} historical bills`)
        await loadBillsData()
      } else {
        toast.info('All historical bills are up to date')
      }
      
    } catch (err) {
      console.error('Error generating historical bills:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate historical bills')
      toast.error('Failed to generate historical bills')
    } finally {
      setIsGeneratingHistorical(false)
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
        notes: `Full payment via bills management page`
      }, user!.id)
      
      toast.success('Bill marked as paid successfully')
      await loadBillsData()
    } catch (err) {
      console.error('Error marking bill as paid:', err)
      toast.error('Failed to mark bill as paid')
    }
  }

  /**
   * Calculate bills statistics
   */
  const calculateStats = useCallback(() => {
    const totalBills = filteredBills.length
    const unpaidBills = filteredBills.filter(bill => bill.status !== 'paid')
    const overdueBills = filteredBills.filter(bill => 
      isAfter(new Date(), bill.paymentDueDate) && bill.status !== 'paid'
    )
    const dueSoonBills = filteredBills.filter(bill => 
      isBefore(new Date(), bill.paymentDueDate) && 
      isAfter(addDays(new Date(), 7), bill.paymentDueDate) && 
      bill.status !== 'paid'
    )

    const totalOutstanding = unpaidBills.reduce((sum, bill) => 
      sum + Math.max(0, bill.billAmount - bill.paidAmount), 0
    )

    return {
      totalBills,
      unpaidBills: unpaidBills.length,
      overdueBills: overdueBills.length,
      dueSoonBills: dueSoonBills.length,
      totalOutstanding
    }
  }, [filteredBills])

  // Load data on component mount
  useEffect(() => {
    loadBillsData()
  }, [loadBillsData])

  // Apply filters when bills or filters change
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const stats = calculateStats()

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex-1 space-y-6">
          <div className="text-center py-8">
            <div className="text-lg">Loading bills...</div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex-1 space-y-6">
          <div className="text-center py-8">
            <div className="text-lg text-red-600">Error: {error}</div>
            <Button onClick={loadBillsData} className="mt-4">
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
            <h2 className="text-3xl font-bold tracking-tight">Credit Card Bills</h2>
            <p className="text-muted-foreground">
              Comprehensive bill management for all your credit cards
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
            <Link href="/credit-cards">
              <Button variant="outline">
                <CreditCard className="h-4 w-4 mr-2" />
                Back to Credit Cards
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
              <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.dueSoonBills}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.totalOutstanding)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bills..."
                    value={filters.searchTerm || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Account Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Credit Card</label>
                <Select
                  value={filters.accountId || 'all'}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    accountId: value === 'all' ? undefined : value 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Cards" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cards</SelectItem>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    status: value === 'all' ? undefined : value as CreditCardBillStatus 
                  }))}
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

              {/* Date From Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <DatePicker
                  date={filters.dateFrom}
                  onDateChange={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                  placeholder="Select start date"
                />
              </div>

              {/* Date To Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <DatePicker
                  date={filters.dateTo}
                  onDateChange={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
                  placeholder="Select end date"
                />
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => setFilters({})}
                disabled={Object.keys(filters).length === 0}
              >
                Clear Filters
              </Button>
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
                    ? 'No credit card bills have been generated yet.' 
                    : 'Try adjusting your filters to see more bills.'
                  }
                </div>
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
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-semibold text-lg">
                                <span className="text-blue-600 font-bold mr-2">
                                  {bill.account?.name || 'Unknown Card'}
                                </span>
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
                            <div className="grid grid-cols-4 gap-4 pt-2 text-sm">
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
                          
                          <div className="text-right space-y-2">
                            {/* Amount display */}
                            <div className="space-y-1">
                              <div className="text-2xl font-bold">
                                {remainingAmount > 0 ? (
                                  <span className="text-red-600">
                                    {formatCurrency(remainingAmount)}
                                  </span>
                                ) : (
                                  <span className="text-green-600 flex items-center">
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
                            <div className="flex space-x-2">
                              <Link href={`/credit-cards/${bill.accountId}/bills`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Details
                                </Button>
                              </Link>
                              
                              {remainingAmount > 0 && (
                                <Button 
                                  onClick={() => handleMarkAsPaid(bill.id)}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Mark Paid
                                </Button>
                              )}
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