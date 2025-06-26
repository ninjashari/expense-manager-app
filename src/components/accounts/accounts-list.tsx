/**
 * @file accounts-list.tsx
 * @description This file contains the accounts list component for displaying and managing accounts.
 * It provides search, filtering, and CRUD operations for user accounts.
 */
'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  CreditCard,
  Wallet,
  PiggyBank,
  TrendingUp,
  Banknote,
  DollarSign,
  Plus,
  RefreshCw
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Pagination, usePagination } from '@/components/ui/pagination'

import { Account, getAccountTypeLabel, getAccountStatusLabel, ACCOUNT_TYPE_OPTIONS, ACCOUNT_STATUS_OPTIONS } from '@/types/account'
import { formatAccountBalance } from '@/lib/services/supabase-account-service'
import { cn } from '@/lib/utils'

/**
 * AccountsList component props
 * @description Props interface for the accounts list component
 */
interface AccountsListProps {
  accounts: Account[]
  onEdit: (account: Account) => void
  onDelete: (accountId: string) => void
  onView: (account: Account) => void
  onAdd: () => void
  onRefresh?: () => void
  isLoading?: boolean
}

/**
 * Get account type icon
 * @description Returns appropriate icon for account type
 * @param type - Account type
 * @returns Icon component
 */
function getAccountTypeIcon(type: string) {
  const iconMap = {
    savings: PiggyBank,
    checking: Wallet,
    credit_card: CreditCard,
    investment: TrendingUp,
    cash: Banknote,
    loan: DollarSign,
    other: Wallet,
  }
  
  const IconComponent = iconMap[type as keyof typeof iconMap] || Wallet
  return <IconComponent className="h-4 w-4" />
}

/**
 * Get status badge variant
 * @description Returns appropriate badge variant for account status
 * @param status - Account status
 * @returns Badge variant
 */
function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'active':
      return 'default'
    case 'inactive':
      return 'secondary'
    case 'closed':
      return 'destructive'
    default:
      return 'outline'
  }
}

/**
 * AccountsList component
 * @description Renders a comprehensive list of accounts with filtering and actions
 * @param accounts - Array of account objects
 * @param onEdit - Function to handle edit action
 * @param onDelete - Function to handle delete action
 * @param onView - Function to handle view action
 * @param onAdd - Function to handle add new account action
 * @param onRefresh - Function to handle refresh/recalculate balances action
 * @param isLoading - Loading state indicator
 * @returns JSX element containing the accounts list
 */
export function AccountsList({ 
  accounts, 
  onEdit, 
  onDelete, 
  onView, 
  onAdd, 
  onRefresh,
  isLoading = false 
}: AccountsListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null)

  /**
   * Filter accounts based on search and filters
   * @description Applies search term and filter criteria to accounts list
   */
  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      const matchesSearch = searchTerm === '' || 
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = typeFilter === 'all' || account.type === typeFilter
      const matchesStatus = statusFilter === 'all' || account.status === statusFilter
      
      return matchesSearch && matchesType && matchesStatus
    })
  }, [accounts, searchTerm, typeFilter, statusFilter])

  // Pagination state management
  const {
    currentPage,
    pageSize,
    onPageChange,
    onPageSizeChange,
  } = usePagination(filteredAccounts.length, 10)

  // Get paginated accounts
  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredAccounts.slice(startIndex, endIndex)
  }, [filteredAccounts, currentPage, pageSize])

  /**
   * Handle delete confirmation
   * @description Opens delete confirmation dialog
   * @param accountId - ID of account to delete
   */
  const handleDeleteClick = (accountId: string) => {
    setAccountToDelete(accountId)
    setDeleteDialogOpen(true)
  }

  /**
   * Confirm delete action
   * @description Executes delete action and closes dialog
   */
  const confirmDelete = () => {
    if (accountToDelete) {
      onDelete(accountToDelete)
      setDeleteDialogOpen(false)
      setAccountToDelete(null)
    }
  }

  /**
   * Cancel delete action
   * @description Closes delete dialog without action
   */
  const cancelDelete = () => {
    setDeleteDialogOpen(false)
    setAccountToDelete(null)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Accounts...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Accounts</CardTitle>
              <CardDescription>
                Manage your bank accounts, credit cards, and wallets. 
                {filteredAccounts.length !== accounts.length ? (
                  <>Showing {filteredAccounts.length} of {accounts.length} accounts</>
                ) : (
                  <>Total: {accounts.length} accounts</>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {onRefresh && (
                <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh Balances
                </Button>
              )}
              <Button onClick={onAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {ACCOUNT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {ACCOUNT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Accounts Table */}
          {filteredAccounts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                {accounts.length === 0 ? (
                  <>
                    <Wallet className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No accounts yet</p>
                    <p className="text-sm">Add your first account to get started</p>
                  </>
                ) : (
                  <>
                    <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No accounts found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Opened</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                              {getAccountTypeIcon(account.type)}
                            </div>
                            <div>
                              <div className="font-medium">{account.name}</div>
                              {account.notes && (
                                <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                  {account.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getAccountTypeIcon(account.type)}
                            <span>{getAccountTypeLabel(account.type)}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(account.status)}>
                            {getAccountStatusLabel(account.status)}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <div className={cn(
                            "font-medium",
                            account.currentBalance < 0 ? "text-destructive" : "text-foreground"
                          )}>
                            {formatAccountBalance(account)}
                          </div>
                          {account.type === 'credit_card' && account.creditCardInfo && (
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div>
                                Limit: {formatAccountBalance({ ...account, currentBalance: account.creditCardInfo.creditLimit })}
                              </div>
                              <div className="flex items-center gap-2">
                                <span>Usage: {account.creditUsagePercentage?.toFixed(1) || '0.0'}%</span>
                                <div className="flex-1 bg-muted rounded-full h-1.5 max-w-[60px]">
                                  <div 
                                    className={cn(
                                      "h-1.5 rounded-full transition-all",
                                      (account.creditUsagePercentage || 0) > 80 ? "bg-destructive" :
                                      (account.creditUsagePercentage || 0) > 60 ? "bg-yellow-500" : "bg-primary"
                                    )}
                                    style={{ width: `${Math.min(account.creditUsagePercentage || 0, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm">
                            {format(account.accountOpeningDate, 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => onView(account)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEdit(account)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Account
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(account.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Account
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredAccounts.length}
                  pageSize={pageSize}
                  onPageChange={onPageChange}
                  onPageSizeChange={onPageSizeChange}
                  pageSizeOptions={[5, 10, 20, 50]}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this account? This action cannot be undone.
              All associated transactions will also be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 