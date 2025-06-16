/**
 * Pay Bill Dialog Component
 * 
 * This component provides a dialog interface for marking credit card bills as paid.
 * It allows users to specify the payment amount, date, and optional notes.
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarIcon, 
  DollarSign, 
  CreditCard, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { PopulatedCreditCardBill } from '@/types/credit-card-bill.types';

// Form validation schema
const payBillSchema = z.object({
  amount: z.number()
    .min(0.01, 'Amount must be greater than 0')
    .max(999999.99, 'Amount is too large'),
  paidDate: z.date({
    required_error: 'Payment date is required',
  }),
  notes: z.string().optional(),
});

type PayBillFormData = z.infer<typeof payBillSchema>;

// Props interface for the component
interface PayBillDialogProps {
  bill: PopulatedCreditCardBill;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, paidDate: Date, notes?: string) => Promise<void>;
  disabled?: boolean;
}

/**
 * Main PayBillDialog component
 * Provides interface for recording bill payments
 */
export const PayBillDialog: React.FC<PayBillDialogProps> = ({
  bill,
  isOpen,
  onClose,
  onConfirm,
  disabled = false,
}) => {
  const { data: session } = useSession();
  const currency = session?.user?.currency || 'INR';
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form setup with validation
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PayBillFormData>({
    resolver: zodResolver(payBillSchema),
    defaultValues: {
      amount: bill.billAmount / 100, // Convert from cents to currency units
      paidDate: new Date(),
      notes: '',
    },
  });

  const watchedAmount = watch('amount');
  const watchedDate = watch('paidDate');

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      reset({
        amount: bill.billAmount / 100,
        paidDate: new Date(),
        notes: '',
      });
    }
  }, [isOpen, bill.billAmount, reset]);

  // Handle form submission
  const onSubmit = async (data: PayBillFormData) => {
    if (isSubmitting || disabled) return;

    setIsSubmitting(true);
    try {
      await onConfirm(
        Math.round(data.amount * 100), // Convert to cents
        data.paidDate,
        data.notes || undefined
      );
      onClose();
    } catch (error) {
      console.error('Failed to pay bill:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // Calculate payment status indicators
  const billAmount = bill.billAmount / 100;
  const minimumPayment = bill.minimumPayment / 100;
  const isFullPayment = watchedAmount >= billAmount;
  const isMinimumPayment = watchedAmount >= minimumPayment;
  const isPartialPayment = watchedAmount > 0 && watchedAmount < billAmount;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pay Credit Card Bill
          </DialogTitle>
          <DialogDescription>
            Record payment for {bill.account.name} bill
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Bill Information */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Bill Amount:</span>
              <span className="font-semibold">
                {formatCurrency(billAmount, currency)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Minimum Payment:</span>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(minimumPayment, currency)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Due Date:</span>
              <span className="text-sm text-muted-foreground">
                {format(new Date(bill.billDueDate), 'MMM dd, yyyy')}
              </span>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payment Amount ({currency})
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max="999999.99"
              placeholder="0.00"
              {...register('amount', { valueAsNumber: true })}
              disabled={isSubmitting || disabled}
              className={errors.amount ? 'border-red-500' : ''}
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
            
            {/* Payment Status Indicators */}
            <div className="flex flex-wrap gap-2 mt-2">
              {isFullPayment && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Full Payment
                </Badge>
              )}
              {isPartialPayment && !isMinimumPayment && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Below Minimum
                </Badge>
              )}
              {isMinimumPayment && !isFullPayment && (
                <Badge variant="secondary">
                  Partial Payment
                </Badge>
              )}
            </div>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Payment Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !watchedDate && 'text-muted-foreground',
                    errors.paidDate && 'border-red-500'
                  )}
                  disabled={isSubmitting || disabled}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watchedDate ? format(watchedDate, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={watchedDate}
                  onSelect={(date) => setValue('paidDate', date || new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.paidDate && (
              <p className="text-sm text-red-600">{errors.paidDate.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this payment..."
              rows={3}
              {...register('notes')}
              disabled={isSubmitting || disabled}
            />
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <Label className="text-sm">Quick Select:</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setValue('amount', minimumPayment)}
                disabled={isSubmitting || disabled}
              >
                Minimum ({formatCurrency(minimumPayment, currency)})
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setValue('amount', billAmount)}
                disabled={isSubmitting || disabled}
              >
                Full Amount ({formatCurrency(billAmount, currency)})
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || disabled || !watchedAmount || watchedAmount <= 0}
            >
              {isSubmitting ? 'Processing...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 