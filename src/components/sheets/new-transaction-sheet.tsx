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
import { IAccount } from '@/models/account.model';
import { ICategory } from '@/models/category.model';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const NewTransactionSheet = () => {
  const { isOpen, onClose } = useNewTransaction();
  
  const queryClient = useQueryClient();

  const { accounts } = useGetAccounts();
  const { categories } = useGetCategories();

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
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
    mutation.mutate(values);
  };

  const accountOptions = accounts.map((account: IAccount) => ({
    label: account.name,
    value: account._id.toString(),
  }));

  const categoryOptions = categories.map((category: ICategory) => ({
    label: category.name,
    value: category._id.toString(),
  }));
  
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="space-y-4">
        <SheetHeader>
          <SheetTitle>New Transaction</SheetTitle>
          <SheetDescription>
            Add a new transaction to track your spending.
          </SheetDescription>
        </SheetHeader>
        <TransactionForm 
          onSubmit={handleSubmit} 
          disabled={mutation.isPending}
          accountOptions={accountOptions}
          categoryOptions={categoryOptions}
          defaultValues={{
            date: new Date(),
            type: 'Expense',
            accountId: '',
            categoryId: '',
            payee: '',
            amount: '0',
            notes: '',
          }}
        />
      </SheetContent>
    </Sheet>
  );
}; 