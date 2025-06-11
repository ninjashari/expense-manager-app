'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useEditTransaction } from '@/hooks/use-edit-transaction';
import { TransactionForm, FormValues } from '@/components/forms/transaction-form';
import { toast } from 'sonner';
import { useGetAccounts } from '@/hooks/use-get-accounts';
import { useGetCategories } from '@/hooks/use-get-categories';
import { IAccount } from '@/models/account.model';
import { ICategory } from '@/models/category.model';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"

export const EditTransactionSheet = () => {
  const { isOpen, onClose, transaction } = useEditTransaction();
  
  const queryClient = useQueryClient();

  const { accounts } = useGetAccounts();
  const { categories } = useGetCategories();

  const deleteMutation = useMutation({
    mutationFn: async () => {
        const response = await fetch(`/api/transactions/${transaction?._id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete transaction');
        }
    },
    onSuccess: () => {
        toast.success('Transaction deleted successfully.');
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
        onClose();
    },
    onError: (error: Error) => {
        toast.error(error.message || 'An unexpected error occurred.');
    }
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
        const response = await fetch(`/api/transactions/${transaction?._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(values),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to edit transaction');
        }
        return response.json();
    },
    onSuccess: () => {
        toast.success('Transaction updated successfully.');
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

  const accountOptions = accounts.map((account) => ({
    label: account.name,
    value: account._id.toString(),
  }));

  const categoryOptions = categories.map((category) => ({
    label: category.name,
    value: category._id.toString(),
  }));

  const defaultValues = transaction ? {
    date: new Date(transaction.date),
    type: transaction.type as "Income" | "Expense",
    account: transaction.account._id.toString(),
    category: transaction.category?._id.toString(),
    payee: transaction.payee,
    amount: transaction.amount.toString(),
    notes: transaction.notes || "",
  } : {
    date: new Date(),
    type: 'Expense' as 'Income' | 'Expense',
    account: '',
    category: '',
    payee: '',
    amount: '0',
    notes: '',
  };
  
  const isTransfer = transaction?.type === "Transfer";

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="space-y-4">
        <SheetHeader>
          <SheetTitle>Edit Transaction</SheetTitle>
          <SheetDescription>
            Edit the details of your transaction.
          </SheetDescription>
        </SheetHeader>
        {transaction && !isTransfer ? (
            <TransactionForm 
                id={transaction._id.toString()}
                onSubmit={handleSubmit} 
                disabled={mutation.isPending}
                accountOptions={accountOptions}
                categoryOptions={categoryOptions}
                defaultValues={defaultValues}
            />
        ) : (
            <div className="flex flex-col items-center justify-center h-full">
                <p>Editing of transfer is not supported.</p>
            </div>
        )}
        {transaction && (
            <div className="pt-4">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full" disabled={deleteMutation.isPending}>
                            <Trash className="size-4 mr-2" />
                            Delete transaction
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate()}>Confirm</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
