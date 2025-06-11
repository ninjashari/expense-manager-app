'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useNewTransaction } from '@/hooks/use-new-transaction';
import { TransactionForm, FormValues } from '@/components/forms/transaction-form';
import { toast } from 'sonner';
import { useGetAccounts } from '@/hooks/use-get-accounts';
import { useGetCategories } from '@/hooks/use-get-categories';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCreateTransaction } from '@/hooks/use-create-transaction';
import { Loader2 } from 'lucide-react';

export function NewTransactionSheet() {
  const { isOpen, onClose } = useNewTransaction();
  
  const queryClient = useQueryClient();

  const createMutation = useCreateTransaction();
  const { categories, isLoading: isLoadingCategories } = useGetCategories();
  const { accounts, isLoading: isLoadingAccounts } = useGetAccounts();

  const isPending = createMutation.isPending || isLoadingCategories || isLoadingAccounts;

  const mutation = useMutation({
    mutationFn: async (values: Omit<FormValues, 'accountId'> & { account: string }) => {
        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(values),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create transaction');
        }
        return response.json();
    },
    onSuccess: () => {
        toast.success('Transaction created successfully.');
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
        onClose();
    },
    onError: (error: Error) => {
        toast.error(error.message || 'An unexpected error occurred.');
    }
  });
  
  const handleSubmit = (values: FormValues) => {
    const { accountId, amount, ...rest } = values;
    const amountInCents = Math.round(parseFloat(amount) * 100);
    mutation.mutate({ 
      ...rest, 
      account: accountId,
      amount: amountInCents.toString()
    });
  };


  
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="space-y-4">
        <SheetHeader>
          <SheetTitle>New Transaction</SheetTitle>
          <SheetDescription>
            Add a new transaction to track your spending.
          </SheetDescription>
        </SheetHeader>
        {isPending ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <TransactionForm 
            onSubmit={handleSubmit} 
            disabled={isPending}
            accounts={accounts || []}
            categories={categories || []}
            defaultValues={{
              date: new Date(),
              type: 'Expense',
              accountId: '',
              payee: '',
              amount: '',
              notes: '',
              categoryId: '',
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
} 