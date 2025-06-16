/**
 * Credit Card Bills Management Page
 * 
 * This page provides a comprehensive interface for managing credit card bills,
 * including viewing, filtering, paying, and configuring bill generation settings.
 * Features advanced filtering, pagination, and real-time bill status updates.
 */

'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Settings, CreditCard, Calendar, DollarSign, X } from 'lucide-react';
import { BillCard } from '@/components/credit-cards/bill-card';
import { PayBillDialog } from '@/components/credit-cards/pay-bill-dialog';
import { BillSettingsForm } from '@/components/credit-cards/bill-settings-form';
import { PaginationControls } from '@/components/pagination/pagination-controls';
import type { 
  CreditCardBill,
  PopulatedCreditCardBill, 
  BillFilters,
  BillGenerationSettings,
  BillStatus 
} from '@/types/credit-card-bill.types';

/**
 * Main Credit Card Bills Management Page Component
 * 
 * Provides comprehensive bill management functionality including:
 * - Bill listing with status indicators
 * - Advanced filtering and search
 * - Bill payment processing
 * - Bill generation settings
 * - Pagination and sorting
 */
export default function CreditCardBillsPage() {
  // State management for UI interactions
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBill, setSelectedBill] = useState<PopulatedCreditCardBill | null>(null);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<'dueDate' | 'amount' | 'status'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<BillFilters>({});

  const queryClient = useQueryClient();

  // Fetch bills with filtering and pagination
  const { data: billsData, isLoading, error } = useQuery({
    queryKey: ['credit-card-bills', { 
      page: currentPage, 
      limit: pageSize, 
      search: searchTerm,
      sortBy,
      sortOrder,
      ...filters 
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              acc[key] = value.join(',');
            } else {
              acc[key] = value.toString();
            }
          }
          return acc;
        }, {} as Record<string, string>)
      });

      const response = await fetch(`/api/credit-card-bills?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bills');
      }
      return response.json();
    },
  });

  // Fetch bill generation settings
  const { data: settings } = useQuery({
    queryKey: ['bill-settings'],
    queryFn: async () => {
      const response = await fetch('/api/credit-card-bills/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      return response.json();
    },
  });

  // Generate bills mutation
  const generateBillsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/credit-card-bills/generate', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to generate bills');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-card-bills'] });
      toast({
        title: 'Success',
        description: 'Bills generated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update bill settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: BillGenerationSettings) => {
      const response = await fetch('/api/credit-card-bills/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill-settings'] });
      setIsSettingsDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Settings updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Calculate bill summary statistics
  const billSummary = useMemo(() => {
    if (!billsData?.bills) return null;

    const bills = billsData.bills as CreditCardBill[];
    const totalBills = bills.length;
    const paidBills = bills.filter((bill: CreditCardBill) => bill.status === 'paid').length;
    const overdueBills = bills.filter((bill: CreditCardBill) => bill.status === 'overdue').length;
    const totalAmount = bills.reduce((sum: number, bill: CreditCardBill) => sum + bill.billAmount, 0);
    const paidAmount = bills
      .filter((bill: CreditCardBill) => bill.status === 'paid')
      .reduce((sum: number, bill: CreditCardBill) => sum + bill.billAmount, 0);

    return {
      totalBills,
      paidBills,
      overdueBills,
      pendingBills: totalBills - paidBills,
      totalAmount,
      paidAmount,
      pendingAmount: totalAmount - paidAmount,
    };
  }, [billsData?.bills]);

  // Handle bill payment
  const handlePayBill = (bill: PopulatedCreditCardBill) => {
    setSelectedBill(bill);
    setIsPayDialogOpen(true);
  };

  // Handle bill editing
  const handleEditBill = (bill: PopulatedCreditCardBill) => {
    // TODO: Implement bill editing functionality
    console.log('Edit bill:', bill);
  };

  // Handle bill deletion
  const handleDeleteBill = (bill: PopulatedCreditCardBill) => {
    // TODO: Implement bill deletion functionality
    console.log('Delete bill:', bill);
  };

  // ... existing code ...

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Error loading bills: {(error as Error).message}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credit Card Bills</h1>
          <p className="text-muted-foreground">
            Manage your credit card bills and payment schedules
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => generateBillsMutation.mutate()}
            disabled={generateBillsMutation.isPending}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Generate Bills
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsSettingsDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Bill Summary Cards */}
      {billSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{billSummary.totalBills}</div>
              <p className="text-xs text-muted-foreground">
                {billSummary.paidBills} paid, {billSummary.pendingBills} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${billSummary.totalAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                ${billSummary.paidAmount.toLocaleString()} paid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Bills</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {billSummary.overdueBills}
              </div>
              <p className="text-xs text-muted-foreground">
                Require immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ${billSummary.pendingAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Outstanding balance
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Bills</CardTitle>
          <CardDescription>
            Use filters to find specific bills or search by card name
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Bills</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by card name, account, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div>
                <Label htmlFor="sortBy">Sort By</Label>
                <Select value={sortBy} onValueChange={(value: 'dueDate' | 'amount' | 'status') => setSortBy(value)}>
                  <SelectTrigger id="sortBy" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dueDate">Due Date</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sortOrder">Order</Label>
                <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                  <SelectTrigger id="sortOrder" className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Asc</SelectItem>
                    <SelectItem value="desc">Desc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="space-y-2">
            <Label>Filter by Status</Label>
            <Select
              value={filters.status?.toString() || ''}
              onValueChange={(value) =>
                setFilters(prev => ({
                  ...prev,
                  status: value === '' ? undefined : value as BillStatus,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="generated">Generated</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <div className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                <span>Search: {searchTerm}</span>
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-sm p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.status && (
              <div className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                <span>Status: {filters.status}</span>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, status: undefined }))}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-sm p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {(searchTerm || filters.status) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilters({});
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Clear all
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bills List */}
      <Card>
        <CardHeader>
          <CardTitle>Bills</CardTitle>
          <CardDescription>
            {billsData?.total ? `${billsData.total} bills found` : 'Loading bills...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : billsData?.bills?.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No bills found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or generate new bills.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {billsData?.bills?.map((bill: PopulatedCreditCardBill) => (
                <BillCard
                  key={bill._id}
                  bill={bill}
                  onPayBill={handlePayBill}
                  onEditBill={handleEditBill}
                  onDeleteBill={handleDeleteBill}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {billsData?.bills?.length > 0 && (
            <div className="mt-6">
              <PaginationControls
                meta={{
                  currentPage,
                  totalPages: Math.ceil((billsData?.total || 0) / pageSize),
                  totalCount: billsData?.total || 0,
                  hasNextPage: currentPage < Math.ceil((billsData?.total || 0) / pageSize),
                  hasPrevPage: currentPage > 1,
                  limit: pageSize,
                }}
                onPageChange={setCurrentPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pay Bill Dialog */}
      {selectedBill && (
        <PayBillDialog
          bill={selectedBill}
          isOpen={isPayDialogOpen}
          onClose={() => setIsPayDialogOpen(false)}
          onConfirm={async (amount: number, paidDate: Date, notes?: string) => {
            // TODO: Implement actual payment API call
            console.log('Payment confirmed:', { amount, paidDate, notes });
            queryClient.invalidateQueries({ queryKey: ['credit-card-bills'] });
            setIsPayDialogOpen(false);
            setSelectedBill(null);
          }}
        />
      )}

      {/* Bill Settings Dialog */}
      <BillSettingsForm
        open={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
        settings={settings}
        onSave={(newSettings) => updateSettingsMutation.mutate(newSettings)}
        isLoading={updateSettingsMutation.isPending}
      />
    </div>
  );
} 