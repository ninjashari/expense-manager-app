/**
 * Bill Card Component
 * 
 * This component displays individual credit card bill information including
 * bill amount, due date, payment status, and available actions. It provides
 * a clean, card-based interface for bill management.
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, isAfter, addDays } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { PopulatedCreditCardBill } from '@/types/credit-card-bill.types';

// Props interface for the component
interface BillCardProps {
  bill: PopulatedCreditCardBill;
  onPayBill: (bill: PopulatedCreditCardBill) => void;
  onEditBill: (bill: PopulatedCreditCardBill) => void;
  onDeleteBill: (bill: PopulatedCreditCardBill) => void;
  className?: string;
  showActions?: boolean;
}

/**
 * Get bill status information including color, icon, and label
 * Determines the visual representation based on payment status and due date
 */
const getBillStatus = (bill: PopulatedCreditCardBill) => {
  const today = new Date();
  const dueDate = new Date(bill.billDueDate);
  const warningDate = addDays(dueDate, -3); // 3 days before due date

  if (bill.isPaid) {
    return {
      status: 'paid',
      label: 'Paid',
      color: 'bg-green-100 text-green-800',
      icon: <CheckCircle className="h-4 w-4" />,
      variant: 'default' as const,
    };
  }

  if (isAfter(today, dueDate)) {
    return {
      status: 'overdue',
      label: 'Overdue',
      color: 'bg-red-100 text-red-800',
      icon: <AlertTriangle className="h-4 w-4" />,
      variant: 'destructive' as const,
    };
  }

  if (isAfter(today, warningDate)) {
    return {
      status: 'due-soon',
      label: 'Due Soon',
      color: 'bg-yellow-100 text-yellow-800',
      icon: <Clock className="h-4 w-4" />,
      variant: 'secondary' as const,
    };
  }

  return {
    status: 'pending',
    label: 'Pending',
    color: 'bg-blue-100 text-blue-800',
    icon: <Clock className="h-4 w-4" />,
    variant: 'outline' as const,
  };
};

/**
 * Main BillCard component
 * Displays credit card bill information with interactive elements
 */
export const BillCard: React.FC<BillCardProps> = ({
  bill,
  onPayBill,
  onEditBill,
  onDeleteBill,
  className = '',
  showActions = true,
}) => {
  const { data: session } = useSession();
  const currency = session?.user?.currency || 'INR';
  const [isLoading, setIsLoading] = useState(false);

  // Get bill status information
  const statusInfo = getBillStatus(bill);

  // Handle payment action
  const handlePayBill = async () => {
    if (bill.isPaid || isLoading) return;
    
    setIsLoading(true);
    try {
      await onPayBill(bill);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate days until due date
  const daysUntilDue = Math.ceil(
    (new Date(bill.billDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className={`transition-all hover:shadow-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                {bill.account?.name || 'Credit Card'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Bill #{bill._id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={statusInfo.variant} className={statusInfo.color}>
              {statusInfo.icon}
              <span className="ml-1">{statusInfo.label}</span>
            </Badge>
            
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditBill(bill)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Bill
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDeleteBill(bill)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Bill
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bill Amount */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Bill Amount</span>
          </div>
          <span className="text-lg font-bold">
            {formatCurrency(bill.billAmount / 100, currency)}
          </span>
        </div>

        {/* Bill Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Generated</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(bill.billGenerationDate), 'MMM dd, yyyy')}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Due Date</span>
            </div>
            <p className={`text-sm font-medium ${
              statusInfo.status === 'overdue' ? 'text-red-600' : 
              statusInfo.status === 'due-soon' ? 'text-yellow-600' : 
              'text-muted-foreground'
            }`}>
              {format(new Date(bill.billDueDate), 'MMM dd, yyyy')}
              {!bill.isPaid && (
                <span className="block text-xs">
                  {daysUntilDue > 0 ? `${daysUntilDue} days left` : 
                   daysUntilDue === 0 ? 'Due today' : 
                   `${Math.abs(daysUntilDue)} days overdue`}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Billing Period */}
        <div className="space-y-1">
          <span className="text-sm font-medium">Billing Period</span>
          <p className="text-sm text-muted-foreground">
            {format(new Date(bill.billingPeriodStart), 'MMM dd')} - {format(new Date(bill.billingPeriodEnd), 'MMM dd, yyyy')}
          </p>
        </div>

        {/* Payment Information */}
        {bill.isPaid && bill.paidDate && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Payment Completed</span>
            </div>
            <p className="text-sm text-green-700">
              Paid on {format(new Date(bill.paidDate), 'MMM dd, yyyy')}
            </p>
          </div>
        )}

        {/* Notes */}
        {bill.notes && (
          <div className="space-y-1">
            <span className="text-sm font-medium">Notes</span>
            <p className="text-sm text-muted-foreground">{bill.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            {!bill.isPaid && (
              <Button 
                onClick={handlePayBill}
                disabled={isLoading}
                className="flex-1"
                variant={statusInfo.status === 'overdue' ? 'destructive' : 'default'}
              >
                {isLoading ? 'Processing...' : 'Mark as Paid'}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => onEditBill(bill)}
              disabled={isLoading}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 