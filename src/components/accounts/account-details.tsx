/**
 * @file account-details.tsx
 * @description This file contains the account details component for viewing account information.
 * It provides a comprehensive view of account details including credit card specific information.
 */
'use client'

import { format } from 'date-fns'
import { 
  Edit, 
  Calendar, 
  CreditCard, 
  Wallet,
  PiggyBank,
  TrendingUp,
  Banknote,
  DollarSign,
  FileText,
  AlertCircle
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { Account, getAccountTypeLabel, getAccountStatusLabel, getCurrencySymbol } from '@/types/account'
import { formatAccountBalance } from '@/lib/services/account-service'
import { cn } from '@/lib/utils'

/**
 * AccountDetails component props
 * @description Props interface for the account details component
 */
interface AccountDetailsProps {
  account: Account
  onEdit: () => void
  onClose: () => void
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
  return <IconComponent className="h-5 w-5" />
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
 * AccountDetails component
 * @description Renders detailed view of account information
 * @param account - Account object to display
 * @param onEdit - Function to handle edit action
 * @param onClose - Function to handle close action
 * @returns JSX element containing the account details
 */
export function AccountDetails({ account, onEdit, onClose }: AccountDetailsProps) {
  const isCreditCard = account.type === 'credit_card'
  const balanceColor = account.currentBalance < 0 ? 'text-destructive' : 'text-foreground'

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                {getAccountTypeIcon(account.type)}
              </div>
              <div>
                <CardTitle className="text-2xl">{account.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  {getAccountTypeLabel(account.type)}
                  <Separator orientation="vertical" className="h-4" />
                  <Badge variant={getStatusBadgeVariant(account.status)}>
                    {getAccountStatusLabel(account.status)}
                  </Badge>
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Account
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Balance Information */}
      <Card>
        <CardHeader>
          <CardTitle>Balance Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Current Balance
              </div>
              <div className={cn("text-3xl font-bold", balanceColor)}>
                {formatAccountBalance(account)}
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Initial Balance
              </div>
              <div className="text-2xl font-semibold">
                {formatAccountBalance({ ...account, currentBalance: account.initialBalance })}
              </div>
            </div>
          </div>

          {isCreditCard && account.creditCardInfo && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Credit Limit
                  </div>
                  <div className="text-xl font-semibold">
                    {formatAccountBalance({ ...account, currentBalance: account.creditCardInfo.creditLimit })}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Available Credit
                  </div>
                  <div className="text-xl font-semibold text-green-600">
                    {formatAccountBalance({ 
                      ...account, 
                      currentBalance: account.creditCardInfo.creditLimit + account.currentBalance 
                    })}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Credit Utilization
                  </div>
                  <div className="text-xl font-semibold">
                    {Math.round((Math.abs(account.currentBalance) / account.creditCardInfo.creditLimit) * 100)}%
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Account Type
                </div>
                <div className="flex items-center gap-2">
                  {getAccountTypeIcon(account.type)}
                  <span className="font-medium">{getAccountTypeLabel(account.type)}</span>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Status
                </div>
                <Badge variant={getStatusBadgeVariant(account.status)}>
                  {getAccountStatusLabel(account.status)}
                </Badge>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Currency
                </div>
                <div className="font-medium">
                  {account.currency} ({getCurrencySymbol(account.currency)})
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Account Opening Date
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {format(account.accountOpeningDate, 'MMMM dd, yyyy')}
                  </span>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Created
                </div>
                <div className="font-medium">
                  {format(account.createdAt, 'MMMM dd, yyyy')}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Last Updated
                </div>
                <div className="font-medium">
                  {format(account.updatedAt, 'MMMM dd, yyyy')}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Card Specific Information */}
      {isCreditCard && account.creditCardInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Credit Card Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Payment Due Date
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">
                    {account.creditCardInfo.paymentDueDate}{getOrdinalSuffix(account.creditCardInfo.paymentDueDate)} of every month
                  </span>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Bill Generation Date
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">
                    {account.creditCardInfo.billGenerationDate}{getOrdinalSuffix(account.creditCardInfo.billGenerationDate)} of every month
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {account.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {account.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Get ordinal suffix for numbers
 * @description Returns ordinal suffix (st, nd, rd, th) for a number
 * @param num - Number to get suffix for
 * @returns Ordinal suffix
 */
function getOrdinalSuffix(num: number): string {
  const j = num % 10
  const k = num % 100
  
  if (j === 1 && k !== 11) {
    return 'st'
  }
  if (j === 2 && k !== 12) {
    return 'nd'
  }
  if (j === 3 && k !== 13) {
    return 'rd'
  }
  return 'th'
} 